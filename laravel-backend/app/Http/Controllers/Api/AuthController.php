<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TwoFactorToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string|max:30|unique:users|regex:/^[a-zA-Z0-9_]+$/',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:8|max:100',
        ]);

        $user = User::create([
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $this->sendVerificationCode($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User created successfully',
            'token' => $token,
            'email_verification_required' => true,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password'], 401);
        }

        // 2FA: do not issue a token until the code is verified.
        if ($user->two_factor_enabled) {
            $code = $this->issueTwoFactorCode($user, 'login');

            $response = [
                'message' => 'Two-factor authentication required',
                'two_factor_required' => true,
                'email' => $user->email,
            ];

            return response()->json($response);
        }

        return $this->issueToken($user);
    }

    /**
     * Complete login after 2FA code verification.
     */
    public function twoFactorLogin(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            return response()->json(['message' => 'Invalid request'], 422);
        }

        $token = TwoFactorToken::where('user_id', $user->id)
            ->where('type', 'login')
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->get()
            ->first(function ($t) use ($data) {
                return Hash::check($data['code'], $t->token);
            });

        if (! $token) {
            return response()->json(['message' => 'Invalid or expired code'], 401);
        }

        $token->update(['used' => true]);

        return $this->issueToken($user);
    }

    public function verifyEmail(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            return response()->json(['message' => 'Invalid request'], 422);
        }

        $records = DB::table('email_verification_tokens')
            ->where('email', $data['email'])
            ->where('expires_at', '>', now())
            ->get();

        $record = $records->first(function ($r) use ($data) {
            return Hash::check($data['code'], $r->token);
        });

        if (! $record) {
            return response()->json(['message' => 'Invalid or expired code'], 401);
        }

        $user->email_verified_at = now();
        $user->save();

        DB::table('email_verification_tokens')->where('email', $data['email'])->delete();

        return response()->json(['message' => 'Email verified', 'verified' => true]);
    }

    public function resendVerification(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);

        $user = User::where('email', $data['email'])->first();

        // Generic response to avoid account enumeration.
        if ($user && ! $user->email_verified_at) {
            $this->sendVerificationCode($user);
        }

        return response()->json(['message' => 'If the email exists, a verification code has been sent.']);
    }

    protected function issueToken(User $user)
    {
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }

    protected function issueTwoFactorCode(User $user, string $type): string
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        TwoFactorToken::where('user_id', $user->id)->where('type', $type)->delete();
        TwoFactorToken::create([
            'user_id' => $user->id,
            'token' => Hash::make($code),
            'type' => $type,
            'used' => false,
            'expires_at' => now()->addMinutes(10),
        ]);

        return $code;
    }

    protected function sendVerificationCode(User $user): void
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('email_verification_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($code), 'expires_at' => now()->addMinutes(60)]
        );

        try {
            Mail::raw("Your Sonix verification code is: {$code}", function ($msg) use ($user) {
                $msg->to($user->email)->subject('Sonix - Verify your email');
            });
        } catch (\Exception $e) {
            // Email delivery is non-blocking for registration.
        }
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|max:100',
        ]);

        $user = $request->user();

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 400);
        }

        $user->password = Hash::make($request->input('new_password'));
        $user->save();

        return response()->json(['message' => 'Password changed successfully']);
    }

    public function deleteAccount(Request $request)
    {
        $request->validate(['password' => 'required|string']);

        $user = $request->user();

        if (! Hash::check($request->input('password'), $user->password)) {
            return response()->json(['message' => 'Password is incorrect'], 400);
        }

        DB::transaction(function () use ($user) {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->json(['message' => 'Account deleted']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            $token = Str::random(8);
            $hashed = Hash::make($token);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $request->email],
                ['token' => $hashed, 'created_at' => now()]
            );

            try {
                Mail::raw("Your password reset code is: {$token}\n\nThis code expires in 60 minutes.", function ($msg) use ($request) {
                    $msg->to($request->email)->subject('Sonix - Password Reset Code');
                });
            } catch (\Exception $e) {
                DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            }
        }

        // Always return the same response to avoid account enumeration.
        return response()->json(['message' => 'If the email exists, a reset code has been sent.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|max:100',
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (! $record || ! Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'Invalid reset code.'], 400);
        }

        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json(['message' => 'Reset code expired.'], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successful.']);
    }
}
