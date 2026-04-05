// app/new/page.tsx
// --------------------------------------------------------
// Reuse the edit page component for the /new route.
// When mounted under /new, there is no albumId in the URL.
// The edit page logic detects the absence of albumId and
// automatically switches to "create" mode, using POST instead of PUT.
// --------------------------------------------------------

// Re-export the default export from the edit route
export { default } from "../edit/[albumId]/page";

// --------------------------------------------------------
// Notes:
//
// • This approach exemplifies code reuse. Both the "new" and "edit"
//   pages share one component, EditAlbumPage, which adjusts behavior
//   based on whether an albumId parameter exists.
//
// • No "use client" directive is needed here; the imported edit page
//   already includes it.
// --------------------------------------------------------
