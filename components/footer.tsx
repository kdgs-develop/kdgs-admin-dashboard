export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-4 text-center text-sm text-gray-500 bg-white border-t">
      <span className="text-sm text-gray-500">
        © {currentYear} Kelowna & District Genealogical Society{" "}
        <a
          href="https://kdgs.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:underline"
        >
          kdgs.ca
        </a>{" "}
        | Powered by Vyoniq Technologies
      </span>
    </footer>
  );
}
