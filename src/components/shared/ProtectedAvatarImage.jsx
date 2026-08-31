import { AvatarImage } from "@/components/ui/avatar";
import { useProtectedMedia } from "@/lib/protectedMedia";

/**
 * Avatar image for photos served by the API behind the Authorization check.
 *
 * A bare <img src={user.photo}> gets a 401 (the browser sends no bearer token),
 * so the hook fetches the bytes and yields a blob: URL. Rendering nothing while
 * loading or on error lets the surrounding <Avatar> fall through to its
 * initials fallback instead of showing a broken-image icon.
 */
export default function ProtectedAvatarImage({ src, alt, className = "" }) {
	const { url, isLoading, error } = useProtectedMedia(src);

	if (!src || isLoading || error || !url) return null;

	return <AvatarImage src={url} alt={alt} className={className} />;
}
