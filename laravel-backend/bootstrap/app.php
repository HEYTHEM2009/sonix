<?php

use App\Http\Middleware\AntiScraping;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\MediaSecurity;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        channels: __DIR__.'/../routes/channels.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            HandleCors::class,
            SecurityHeaders::class,
            AntiScraping::class,
        ]);

        $middleware->alias([
            'media.security' => MediaSecurity::class,
            'admin' => EnsureAdmin::class,
        ]);

        // Sensible default rate limit for all API routes.
        $middleware->throttleApi();

        $middleware->redirectGuestsTo(
            fn (Request $request) => $request->is('api/*')
                ? abort(401, 'Unauthenticated')
                : route('login'),
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Secure error handling: never leak internal details to clients.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Handle validation errors with 422 and field-level details.
            if ($e instanceof ValidationException) {
                $debug = config('app.debug');

                $payload = [
                    'message' => $debug ? $e->getMessage() : 'The given data was invalid.',
                    'errors' => $e->errors(),
                ];

                return response()->json($payload, 422);
            }

            $status = method_exists($e, 'getStatusCode')
                ? $e->getStatusCode()
                : ($e instanceof HttpException ? $e->getStatusCode() : 500);

            $debug = config('app.debug');

            $payload = [
                'message' => $debug ? $e->getMessage() : 'An unexpected error occurred. Please try again later.',
            ];

            if ($debug) {
                $payload['exception'] = get_class($e);
                $payload['file'] = $e->getFile();
                $payload['line'] = $e->getLine();
            }

            return response()->json($payload, $status);
        });
    })->create();
