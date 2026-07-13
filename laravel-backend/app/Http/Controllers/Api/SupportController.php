<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class SupportController extends Controller
{
    public function feedback(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $tableExists = Schema::hasTable('support_messages');
        if (!$tableExists) {
            return response()->json(['error' => 'support_messages table does not exist'], 500);
        }

        try {
            SupportMessage::create([
                'user_id' => $request->user()->id,
                'subject' => $request->subject,
                'message' => $request->message,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }

        return response()->json(['message' => 'Feedback submitted']);
    }
}
