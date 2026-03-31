import React, { useEffect, useMemo, useRef, useState } from "react";

export default function ChatBox({
  conversations,
  selectedConversationId,
  messages,
  currentUserId,
  onSelectConversation,
  onSendMessage,
}) {
  const [content, setContent] = useState("");
  const messagesEndRef = useRef(null);

  const conversationList = useMemo(() => Array.isArray(conversations) ? conversations : [], [conversations]);

  // Lấy thông tin cuộc trò chuyện hiện tại để trích xuất tên shop
  const currentConv = useMemo(() => {
    return conversationList.find(c => String(c.id) === String(selectedConversationId));
  }, [conversationList, selectedConversationId]);

  useEffect(() => {
    // Auto scroll to the newest message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversationId]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    await onSendMessage?.(trimmed);
    setContent("");
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 15px" }}>
      <div style={{ backgroundColor: "white", padding: "15px 20px", borderRadius: "2px", marginBottom: "15px", boxShadow: "0 1px 1px rgba(0,0,0,0.05)" }}>
        <h2 style={{ margin: 0, color: "#333", fontSize: 18, textTransform: "uppercase" }}>
          Chat
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 15, alignItems: "stretch" }}>
        {/* Sidebar danh sách hội thoại */}
        <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 800 }}>
            Cuộc trò chuyện
          </div>
          {conversationList.length === 0 ? (
            <div style={{ padding: 12, color: "#64748b" }}>Chưa có cuộc trò chuyện.</div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: "auto" }}>
              {conversationList.map((c) => {
                const active = String(c.id) === String(selectedConversationId);
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectConversation?.(c.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 12px",
                      border: "none",
                      background: active ? "#eef2ff" : "transparent",
                      cursor: "pointer",
                      borderBottom: "1px solid #eef2f7",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#111827" }}>
                      {c.shop?.name || (c.shop_id ? `Shop #${c.shop_id}` : `Conversation #${c.id}`)}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Tin nhắn: {(c.messages || []).length}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Khung hiển thị tin nhắn */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 800 }}>
            {currentConv?.shop?.name || (currentConv?.shop_id ? `Shop #${currentConv?.shop_id}` : "Chọn cuộc trò chuyện")}
          </div>

          <div style={{ padding: 12, flex: 1, overflowY: "auto", background: "#fff" }}>
            {selectedConversationId ? (
              messages && messages.length > 0 ? (
                messages.map((m) => {
                  const isMe = currentUserId && String(m.sender_id) === String(currentUserId);
                  
                  // Xác định tên người gửi (Bạn hoặc Tên Shop)
                  const senderName = isMe 
                    ? "Bạn" 
                    : (currentConv?.shop?.name || (currentConv?.shop_id ? `Shop #${currentConv?.shop_id}` : "Shop"));

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start", // Đổi lề: Bạn ở phải, Shop ở trái
                        marginBottom: 15,
                      }}
                    >
                      {/* Hiển thị Tên người gửi */}
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, padding: "0 4px", fontWeight: 600 }}>
                        {senderName}
                      </div>

                      {/* Bong bóng tin nhắn */}
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: isMe ? "#eef2ff" : "#f1f5f9",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div style={{ fontSize: 14, color: "#111827", whiteSpace: "pre-wrap" }}>
                          {m.content}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, textAlign: isMe ? "right" : "left" }}>
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString() : ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: "#64748b", textAlign: "center", marginTop: 20 }}>Chưa có tin nhắn.</div>
              )
            ) : (
              <div style={{ color: "#64748b", textAlign: "center", marginTop: 20 }}>Hãy chọn một cuộc trò chuyện để xem tin nhắn.</div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <div style={{ padding: 12, borderTop: "1px solid #e5e7eb", background: "#f8fafc" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập tin nhắn..."
                style={{
                  flex: 1,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  padding: "10px 12px",
                  outline: "none",
                }}
                disabled={!selectedConversationId}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                onClick={handleSend}
                disabled={!selectedConversationId || !content.trim()}
                style={{
                  minWidth: 120,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "#ee4d2d",
                  color: "white",
                  fontWeight: 800,
                  cursor: selectedConversationId ? "pointer" : "not-allowed",
                }}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}