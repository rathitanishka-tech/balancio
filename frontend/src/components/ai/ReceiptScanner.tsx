import * as React from "react";
import { Camera, Image as ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi, AIExpenseDraft } from "@/lib/api/ai";
import { toast } from "sonner";
import { AIReceiptExtraction } from "@/lib/api/ai";

interface ReceiptScannerProps {
  onDraftGenerated: (draft: AIExpenseDraft) => void;
}

export function ReceiptScanner({ onDraftGenerated }: ReceiptScannerProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }

  function handleClear() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleScan() {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const extraction = await aiApi.parseReceipt(file);
      
      // Transform AIReceiptExtraction to AIExpenseDraft to reuse the drafting UI
      const draft: AIExpenseDraft = {
        intent: "CREATE_EXPENSE",
        title: extraction.merchant ? `Receipt: ${extraction.merchant}` : "Scanned Receipt",
        amountMinor: extraction.totalMinor,
        currency: extraction.currency,
        date: extraction.date,
        category: extraction.category,
        notes: extraction.lineItems 
          ? `Items:\n${extraction.lineItems.map(i => `- ${i.name}`).join("\n")}`
          : undefined,
        confidence: extraction.confidence,
      };
      
      onDraftGenerated(draft);
      handleClear();
    } catch (error: any) {
      console.error(error);
      toast.error("Couldn't process that receipt. Make sure the image is clear.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-accent-violet/30 bg-surface-2 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-accent-violet">
        <Camera className="h-4 w-4" />
        <span>Scan Receipt</span>
      </div>

      {!file ? (
        <div 
          className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-line-subtle bg-surface-1 py-8 text-ink-muted hover:border-accent-violet hover:text-accent-violet transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="mb-2 h-8 w-8" />
          <p className="text-sm">Click to upload or take a photo</p>
          <p className="text-xs opacity-70">JPG, PNG up to 5MB</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-md border border-line-subtle bg-surface-1">
          {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Receipt preview" 
              className="h-[200px] w-full object-cover opacity-80 mix-blend-lighten"
            />
          )}
          <button 
            onClick={handleClear}
            disabled={isProcessing}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 backdrop-blur-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      <div className="flex justify-end">
        <Button 
          onClick={handleScan} 
          disabled={!file || isProcessing}
          size="sm"
          className="bg-accent-violet text-white hover:bg-accent-violet/90"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="mr-2 h-4 w-4" />
          )}
          Process Receipt
        </Button>
      </div>
    </div>
  );
}
