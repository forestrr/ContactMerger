import ExcelToVCFConverter from "@/components/ExcelToVCFConverter";

export default function Home() {
  return (
    <div className="bg-background min-h-screen font-sans text-foreground">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Excel to VCF Converter</h1>
          <p className="text-muted-foreground">Convert your Excel contact list to a single VCF file</p>
        </header>

        <ExcelToVCFConverter />

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Excel to VCF Converter &copy; {new Date().getFullYear()}</p>
          <div className="mt-2">
            <a href="#" className="text-primary hover:underline mr-4">Privacy Policy</a>
            <a href="#" className="text-primary hover:underline">Help</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
