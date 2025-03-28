export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-gray-500 bg-white border-t">
      <span className="text-sm text-gray-500">
        © {currentYear} Kelowna & District Genealogical Society | Developed by
        Javier Gongora —{" "}
        {/* <a
          href="https://vyoniq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-950 hover:underline"
        > */}
        Vyoniq Technologies
        {/* </a> */}
      </span>
    </footer>
  );
}
