export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-gray-500 bg-white border-t z-10">
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
        | Developed by Javier Gongora — Vyoniq Technologies
      </span>
    </footer>
  );
}
