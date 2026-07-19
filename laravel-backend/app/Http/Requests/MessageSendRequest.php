<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MessageSendRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => 'nullable|string|max:4000',
            'type' => 'sometimes|string|in:text,image,voice,sticker,document',
            'image' => 'nullable|string',
            'voice' => 'nullable|string',
            'reply_to' => 'nullable|integer|exists:messages,id',
            'duration' => 'nullable|integer|min:0|max:600',
        ];
    }
}
