# Sonix — Laravel API Backend

RESTful API backend for the Sonix social media platform, built with Laravel 13 and PostgreSQL.

## Requirements

- PHP 8.3+
- Composer 2.x
- PostgreSQL 15+ (or MySQL 8+)
- Redis (optional, for caching/queues)

## Quick Start

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Configure `.env` with your database credentials, then:

```bash
php artisan migrate
php artisan serve
```

The API runs at `http://localhost:8000/api`.

## Project Structure

```
laravel-backend/
├── app/
│   ├── Console/Commands/      # Custom artisan commands
│   ├── Helpers/               # StorageHelper (Cloudinary + local)
│   ├── Http/
│   │   ├── Controllers/Api/   # 22 API controllers
│   │   └── Middleware/         # AntiScraping, SecurityHeaders, MediaSecurity
│   ├── Models/                # 33 Eloquent models
│   └── Services/              # CloudinaryService
├── config/                    # Laravel configuration
├── database/migrations/       # 56 migrations
└── routes/api.php             # 95+ API routes
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login |
| POST | `/auth/forgot-password` | Send reset code |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/change-password` | Change password |
| DELETE | `/auth/account` | Delete account |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users |
| GET | `/users/search` | Search users |
| GET | `/users/me` | Current user profile |
| POST | `/users/profile` | Update profile |
| GET | `/users/{id}` | User profile |
| GET | `/users/{id}/stats` | User stats |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | Feed posts |
| POST | `/posts` | Create post |
| GET | `/posts/{id}` | Single post |
| PUT | `/posts/{id}` | Update post |
| DELETE | `/posts/{id}` | Delete post |
| GET | `/posts/hashtag/{tag}` | Posts by hashtag |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messages` | Send message |
| GET | `/messages/conversations` | Conversation list |
| GET | `/messages/{userId}` | Message history |
| POST | `/messages/{id}/react` | Add reaction |
| POST | `/messages/{id}/vanish` | Toggle vanish mode |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stories` | Feed stories |
| POST | `/stories` | Create story |
| POST | `/stories/{id}/view` | Mark viewed |
| POST | `/stories/{id}/react` | React to story |

### Group Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/groups` | My groups |
| POST | `/groups` | Create group |
| POST | `/groups/{id}/members` | Add members |
| POST | `/groups/{id}/messages` | Send message |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/media/{path}` | Serve media file |
| POST | `/media/sign` | Sign upload |

## Docker Deployment

```bash
docker build -t sonix-backend .
docker run -p 80:80 sonix-backend
```

## License

MIT
