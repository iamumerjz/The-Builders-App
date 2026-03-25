import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type NegotiationMessage = {
  id: string;
  sender: "client" | "pro";
  type: "offer" | "counter" | "accept" | "reject";
  amount?: number;
  timestamp: string;
};

export type Negotiation = {
  id: string;
  proId: string;
  proName: string;
  proAvatar: string;
  clientName: string;
  service: string;
  listedRate: number;
  status: "active" | "accepted" | "rejected";
  messages: NegotiationMessage[];
};

interface NegotiationThreadProps {
  negotiation: Negotiation;
  viewAs: "client" | "pro";
  onAction: (negId: string, action: "accept" | "reject" | "counter", amount?: number) => void;
}

const NegotiationThread = ({ negotiation, viewAs, onAction }: NegotiationThreadProps) => {
  const [counterAmount, setCounterAmount] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [negotiation.messages, negotiation.status]);

  const lastMessage = negotiation.messages[negotiation.messages.length - 1];
  const isMyTurn =
    negotiation.status === "active" &&
    lastMessage &&
    lastMessage.sender !== viewAs &&
    lastMessage.type !== "accept" &&
    lastMessage.type !== "reject";

  const statusColor =
    negotiation.status === "accepted"
      ? "bg-success/15 text-success"
      : negotiation.status === "rejected"
      ? "bg-destructive/15 text-destructive"
      : "bg-primary/15 text-primary";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <img
          src={negotiation.proAvatar}
          alt={viewAs === "client" ? negotiation.proName : negotiation.clientName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {viewAs === "client" ? negotiation.proName : negotiation.clientName}
          </p>
          <p className="text-xs text-muted-foreground">
            {negotiation.service} · Listed PKR {negotiation.listedRate}/hr
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${statusColor}`}>
          {negotiation.status}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {negotiation.messages.map((msg, i) => {
          const isMe = msg.sender === viewAs;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                  msg.type === "accept"
                    ? "bg-success/15 border border-success/30"
                    : msg.type === "reject"
                    ? "bg-destructive/15 border border-destructive/30"
                    : isMe
                    ? "bg-primary/15 border border-primary/30"
                    : "bg-muted border border-border"
                }`}
              >
                <p className="text-[10px] text-muted-foreground mb-1">
                  {msg.sender === "client" ? (viewAs === "client" ? "You" : negotiation.clientName) : (viewAs === "pro" ? "You" : negotiation.proName)}
                  {" · "}{msg.timestamp}
                </p>
                {msg.type === "offer" && (
                  <p className="text-sm font-semibold text-foreground">
                    Offered <span className="text-primary">PKR {msg.amount}/hr</span>
                  </p>
                )}
                {msg.type === "counter" && (
                  <p className="text-sm font-semibold text-foreground">
                    Countered with <span className="text-primary">PKR {msg.amount}/hr</span>
                  </p>
                )}
                {msg.type === "accept" && (
                  <p className="text-sm font-semibold text-success flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Accepted the offer
                  </p>
                )}
                {msg.type === "reject" && (
                  <p className="text-sm font-semibold text-destructive flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Rejected the offer
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      {isMyTurn && (
        <div className="p-4 border-t border-border space-y-3">
          <p className="text-xs text-muted-foreground">Your turn to respond:</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => onAction(negotiation.id, "accept")}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Accept
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onAction(negotiation.id, "reject")}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => setShowCounter(!showCounter)}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Counter
            </Button>
          </div>

          <AnimatePresence>
            {showCounter && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-visible"
              >
                <div className="flex gap-2 mt-1 py-1">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Your counter (PKR/hr)"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value.replace(/\D/g, ""))}
                      className="bg-muted border-border text-foreground focus-visible:ring-primary/30 focus-visible:ring-offset-0"
                    />
                    {counterAmount && parseInt(counterAmount) < 500 && (
                      <p className="text-[10px] text-destructive">Minimum PKR 500/hr</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    disabled={!counterAmount || parseInt(counterAmount) < 500}
                    onClick={() => {
                      const val = parseInt(counterAmount);
                      if (val < 500) return;
                      onAction(negotiation.id, "counter", val);
                      setCounterAmount("");
                      setShowCounter(false);
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {negotiation.status !== "active" && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground text-center">
            {negotiation.status === "accepted"
              ? `Deal agreed at PKR ${lastMessage?.amount || negotiation.listedRate}/hr`
              : "This negotiation has been closed."}
          </p>
        </div>
      )}
    </div>
  );
};

export default NegotiationThread;