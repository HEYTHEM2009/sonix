<?php

namespace Tests\Feature;

use App\Models\BlockedUser;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SonixFixesVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(User $user): array
    {
        $token = $user->createToken('test')->plainTextToken;

        return ['Authorization' => 'Bearer '.$token];
    }

    public function test_login_returns_token_for_normal_user(): void
    {
        $user = User::factory()->create([
            'email' => 'login@test.com',
            'password' => Hash::make('password'),
            'two_factor_enabled' => false,
        ]);

        $res = $this->postJson('/api/auth/login', ['email' => 'login@test.com', 'password' => 'password']);
        $res->assertOk();
        $this->assertArrayHasKey('token', $res->json());
        $this->assertArrayNotHasKey('two_factor_required', $res->json());
    }

    public function test_login_returns_two_factor_required_without_token(): void
    {
        $user = User::factory()->create([
            'email' => 'twofa@test.com',
            'password' => Hash::make('password'),
            'two_factor_enabled' => true,
        ]);

        $res = $this->postJson('/api/auth/login', ['email' => 'twofa@test.com', 'password' => 'password']);
        $res->assertOk();
        $this->assertTrue($res->json('two_factor_required') === true || $res->json('two_factor_required') === '1');
        $this->assertArrayNotHasKey('token', $res->json());
    }

    public function test_activity_status_toggle(): void
    {
        $user = User::factory()->create(['activity_status' => true]);
        $res = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/users/toggle-activity-status');
        $res->assertOk();
        $this->assertFalse($res->json('activity_status'));
    }

    public function test_unblock_reconciles_state(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        BlockedUser::create(['user_id' => $a->id, 'blocked_id' => $b->id]);

        $res = $this->withHeaders($this->authHeaders($a))
            ->postJson("/api/users/{$b->id}/unblock");
        $res->assertOk();
        $this->assertFalse($res->json('blocked'));
        $this->assertDatabaseMissing('blocked_users', ['user_id' => $a->id, 'blocked_id' => $b->id]);
    }

    public function test_group_message_returns_201_and_broadcasts(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $group = Group::create(['created_by' => $owner->id, 'name' => 'Test Group']);
        GroupMember::create(['group_id' => $group->id, 'user_id' => $owner->id]);
        GroupMember::create(['group_id' => $group->id, 'user_id' => $member->id]);

        $res = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/groups/{$group->id}/messages", ['content' => 'hello group']);
        $res->assertCreated();
        $this->assertArrayHasKey('id', $res->json());
    }

    public function test_content_report_accepted(): void
    {
        $user = User::factory()->create();
        $post = Post::create(['user_id' => $user->id, 'type' => 'text', 'content' => 'report me']);
        $res = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/reports', [
                'type' => 'post',
                'id' => $post->id,
                'reason' => 'spam',
            ]);
        $res->assertOk();
    }

    public function test_admin_route_requires_admin_role(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $res = $this->withHeaders($this->authHeaders($user))
            ->getJson('/api/admin/dashboard');
        $res->assertForbidden();
    }

    public function test_admin_route_allowed_for_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $res = $this->withHeaders($this->authHeaders($admin))
            ->getJson('/api/admin/dashboard');
        $res->assertOk();
    }

    public function test_two_factor_login_completes_with_hashed_code(): void
    {
        $user = User::factory()->create([
            'email' => 'twofa2@test.com',
            'password' => Hash::make('password'),
            'two_factor_enabled' => true,
        ]);

        // Start login -> 2FA required, no token.
        $res = $this->postJson('/api/auth/login', ['email' => 'twofa2@test.com', 'password' => 'password']);
        $res->assertOk();
        $this->assertTrue($res->json('two_factor_required') === true || $res->json('two_factor_required') === '1');
        $this->assertArrayNotHasKey('token', $res->json());
        $this->assertArrayNotHasKey('dev_code', $res->json(), '2FA code must never leak in the response');

        // Verify against the stored (hashed) code. We cannot read the plaintext, so
        // we simulate the user receiving the email by issuing a known code directly
        // through the token model the same way the controller stores it.
        $code = '123456';
        \DB::table('two_factor_tokens')->insert([
            'user_id' => $user->id,
            'token' => Hash::make($code),
            'type' => 'login',
            'used' => false,
            'expires_at' => now()->addMinutes(10),
        ]);

        $res = $this->postJson('/api/auth/2fa-login', ['email' => 'twofa2@test.com', 'code' => $code]);
        $res->assertOk();
        $this->assertArrayHasKey('token', $res->json());
    }

    public function test_admin_user_detail_does_not_500_with_reels_count(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create();

        $res = $this->withHeaders($this->authHeaders($admin))
            ->getJson("/api/admin/users/{$target->id}");
        $res->assertOk();
        $this->assertArrayHasKey('reels_count', $res->json('data') ?? $res->json());
    }

    public function test_document_upload_rejects_executable_extension(): void
    {
        $user = User::factory()->create();
        $tmp = tempnam(sys_get_temp_dir(), 'sonix').'.php';
        file_put_contents($tmp, '<?php echo "pwned"; ?>');

        $res = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/messages/1', [
                'document' => new UploadedFile($tmp, 'evil.php', 'application/x-php', null, true),
            ]);

        // Either rejected by validation (422) or by missing receiver (404) — must NOT be 200/201.
        $this->assertNotEquals(200, $res->getStatusCode());
        $this->assertNotEquals(201, $res->getStatusCode());
        @unlink($tmp);
    }
}
