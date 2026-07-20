<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VoiceMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class VoiceMessageController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimes:mp3,wav,m4a,ogg|max:10240',
            'conversation_id' => 'nullable|integer',
            'duration' => 'required|integer',
        ]);

        $audioPath = $request->file('audio')->store('voice-messages', 'public');

        $voice = VoiceMessage::create([
            'user_id' => Auth::id(),
            'conversation_id' => $request->conversation_id,
            'audio_url' => Storage::disk('public')->url($audioPath),
            'duration' => $request->duration,
        ]);

        return response()->json($voice, 201);
    }

    public function show($id)
    {
        $voice = VoiceMessage::findOrFail($id);

        return response()->json($voice);
    }

    public function destroy($id)
    {
        $voice = VoiceMessage::where('user_id', Auth::id())->findOrFail($id);
        $voice->delete();

        return response()->json(['message' => 'Voice message deleted']);
    }
}
