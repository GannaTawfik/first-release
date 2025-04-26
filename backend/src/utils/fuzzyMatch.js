import Fuse from "fuse.js";

export default function fuzzyMatch(userHeaders, originalHeaders) {
	const options = {
		includeScore: true,
		threshold: 0.4,
		keys: [""], // Search directly in strings
	};

	const fuse = new Fuse(originalHeaders, options);

	return userHeaders.map((header) => {
		const result = fuse.search(header);
		return result.length > 0 ? result[0].item : null;
	});
}
