<?php
declare(strict_types=1);

namespace App\Validators;

use App\Helpers\HttpException;
use App\Helpers\Password;
use App\Helpers\Str;

/** Validasi pendaftaran pemilik usaha. Password selalu di-hash di server. */
final class RegisterValidator
{
    /** @return array{name: string, bizName: string, username: string, email: string, phone: string, contact: string, password: string} */
    public function validate($d): array
    {
        if (!is_object($d)) throw new HttpException('Data pendaftaran tidak lengkap.');

        $name     = trim((string)($d->name ?? ''));
        $bizName  = trim((string)($d->bizName ?? ''));
        $username = trim((string)($d->username ?? ''));
        $email    = Str::lower(trim((string)($d->email ?? '')));
        $phone    = trim((string)($d->phone ?? ''));
        $contact  = trim((string)($d->contact ?? ''));
        $password = (string)($d->password ?? '');

        // Kompatibilitas dengan form lama yang mengirim field "contact" (bisa email atau nomor HP).
        if ($contact !== '') {
            if (str_contains($contact, '@') && $email === '') {
                $email = Str::lower($contact);
            } elseif (!str_contains($contact, '@') && $phone === '') {
                $phone = $contact;
            }
        }
        if ($contact === '') {
            $contact = $email !== '' ? $email : $phone;
        }

        $len = static fn(string $s) => mb_strlen($s);
        if ($len($name) < 2 || $len($name) > 100 || $len($bizName) < 2 || $len($bizName) > 120 || ($email === '' && $phone === '')) {
            throw new HttpException('Lengkapi nama, nama usaha, dan email / nomor HP.');
        }
        if ($email !== '' && ($len($email) > 120 || filter_var($email, FILTER_VALIDATE_EMAIL) === false)) {
            throw new HttpException('Format email tidak valid.');
        }
        if ($phone !== '' && $len($phone) > 30) {
            throw new HttpException('Nomor HP maksimal 30 karakter.');
        }

        UsernameRule::check($username);
        if (!Password::acceptable($password)) throw new HttpException('Password harus 12–128 karakter.');

        return [
            'name'     => $name,
            'bizName'  => $bizName,
            'username' => $username,
            'email'    => $email,
            'phone'    => $phone,
            'contact'  => $contact,
            'password' => $password,
        ];
    }
}
