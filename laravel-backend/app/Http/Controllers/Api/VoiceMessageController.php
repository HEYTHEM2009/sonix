<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        $voice = \App\Models\VoiceMessage::create([
            'user_id' => Auth::id(),
            'conversation_id' => $request->conversation_id,
            'audio_url' => \Illuminate\Support\Facades\Storage::disk('public')->url($audioPath),
            'duration' => $request->duration,
        ]);

        return response()->json($voice, 201);
    }

    public function show($id)
    {
        $voice = \App\Models\VoiceMessage::findOrFail($id);
        return response()->json($voice);
    }

    public function destroy($id)
    {
        $voice = \App\Models\VoiceMessage::where('user_id', Auth::id())->findOrFail($id);
        $voice->delete();
        return response()->json(['message' => 'Voice message deleted']);
    }
}
