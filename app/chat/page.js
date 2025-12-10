import ClientChat from "./ClientChat";

export default function ChatPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Library Assistant</h1>
        <p className="text-sm text-muted-foreground">Ask about books, rules, and borrowing/returning.</p>
      </div>
      <ClientChat />
    </div>
  );
}

