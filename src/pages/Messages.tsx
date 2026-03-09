import { DashboardLayout } from "@/components/DashboardLayout";
import { Send, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const conversations = [
  { id: 1, name: "Coca-Cola Team", lastMsg: "Sounds great! Let's confirm the route.", time: "2 min ago", unread: 2 },
  { id: 2, name: "Samsung Marketing", lastMsg: "Can we extend the campaign by 3 days?", time: "1 hr ago", unread: 0 },
  { id: 3, name: "Nike OOH Dept", lastMsg: "Proof of service looks good. Approved!", time: "3 hr ago", unread: 0 },
  { id: 4, name: "Local Brewery Co.", lastMsg: "What's the availability for April?", time: "Yesterday", unread: 1 },
  { id: 5, name: "Tesla Fleet Ops", lastMsg: "Driver confirmed for tomorrow morning.", time: "Yesterday", unread: 0 },
];

const messages = [
  { from: "them", text: "Hi! We'd like to book the Times Square route for 2 weeks.", time: "10:30 AM" },
  { from: "me", text: "Absolutely! We have 3 trucks available for that route. I'll send over the pricing.", time: "10:35 AM" },
  { from: "them", text: "Perfect. Can you also include evening hours coverage?", time: "10:42 AM" },
  { from: "me", text: "Yes, we offer extended evening runs from 6 PM to midnight at +20%. I'll include that in the offer.", time: "10:45 AM" },
  { from: "them", text: "Sounds great! Let's confirm the route.", time: "10:48 AM" },
];

const Messages = () => {
  const [selected, setSelected] = useState(0);
  const [showThread, setShowThread] = useState(false);

  return (
    <DashboardLayout title="Messages" subtitle="Communication center">
      <div className="card-elevated overflow-hidden flex h-[calc(100vh-12rem)]">
        {/* Conversation List */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col shrink-0 ${showThread ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border">
            <Input placeholder="Search conversations..." className="bg-secondary border-0 text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setSelected(i); setShowThread(true); }}
                className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${i === selected ? "bg-sidebar-accent" : "hover:bg-secondary/50"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${i === selected ? "text-primary" : "text-foreground"}`}>{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate pr-2">{c.lastMsg}</p>
                  {c.unread > 0 && (
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showThread ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 md:px-6 py-4 border-b border-border flex items-center gap-3">
            <button onClick={() => setShowThread(false)} className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-semibold text-foreground">{conversations[selected].name}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-xl px-4 py-2.5 ${m.from === "me" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                  <p className="text-sm">{m.text}</p>
                  <p className={`text-xs mt-1 ${m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 md:p-4 border-t border-border flex gap-2">
            <Input placeholder="Type a message..." className="flex-1 bg-secondary border-0" />
            <button className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
