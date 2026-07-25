<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TwoFactorToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class TwoFactorController extends Controller
{
    public function enable(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        if (! Hash::check($request->password, Auth::user()->password)) {
            return response()->json(['error' => 'Invalid password'], 401);
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        TwoFactorToken::create([
            'user_id' => Auth::id(),
            'token' => Hash::make($code),
            'type' => 'enable_2fa',
            'expires_at' => now()->addMinutes(10),
        ]);

        // In production, send $code via email/SMS here
        \Log::info('2FA enable code for user '.Auth::id().': '.$code);

        return response()->json([
            'message' => 'Verification code sent to your email',
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $token = TwoFactorToken::where('user_id', Auth::id())
            ->where('type', 'enable_2fa')
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $token || ! Hash::check($request->code, $token->token)) {
            return response()->json(['error' => 'Invalid or expired code'], 401);
        }

        $token->update(['used' => true]);

        User::where('id', Auth::id())->update([
            'two_factor_enabled' => true,
        ]);

        return response()->json(['message' => '2FA enabled successfully', 'verified' => true]);
    }

    public function disable(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        if (! Hash::check($request->password, Auth::user()->password)) {
            return response()->json(['error' => 'Invalid password'], 401);
        }

        $token = TwoFactorToken::where('user_id', Auth::id())
            ->where('type', 'disable_2fa')
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $token || ! Hash::check($request->code, $token->token)) {
            return response()->json(['error' => 'Invalid or expired 2FA code'], 401);
        }

        $token->update(['used' => true]);

        User::where('id', Auth::id())->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
        ]);

        return response()->json(['message' => '2FA disabled']);
    }

    public function status()
    {
        $user = Auth::user();

        return response()->json([
            'two_factor_enabled' => $user->two_factor_enabled,
        ]);
    }
}
