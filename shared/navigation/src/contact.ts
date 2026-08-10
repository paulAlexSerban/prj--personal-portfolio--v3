export const CONTACT_EMAIL = 'paul.alex.serban@gmail.com';
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
export const GITHUB_URL = 'https://github.com/paulAlexSerban';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/paulalexs/';

export function encodeToBase64(str: string): string {
    try {
        return btoa(str);
    } catch {
        throw new Error('Failed to encode to base64');
    }
}

export function decodeFromBase64(str: string): string {
    try {
        return atob(str);
    } catch (err) {
        console.error('An error occurred while decoding the string: ', err);
        return '';
    }
}
