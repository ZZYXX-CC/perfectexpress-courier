module.exports = [
"[project]/src/utils/supabase/server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
;
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://jcnoftoyozkvndkqldfx.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjbm9mdG95b3prdm5ka3FsZGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjAwMDEsImV4cCI6MjA4NDEzNjAwMX0.aFLGu0zrIk-YQ0pAh73BpaTH37GfNt6e3-oAEOPfKXM"), {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
                }
            }
        }
    });
}
}),
"[project]/src/app/actions/chat.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00ba9ca8722145ec910340bfde54a94e8b93081338":"getActiveChatSessions","4014455e22b76c012584d01728b3a7e44c3d3f72fe":"getChatMessages","402f3190d29c01c111be5483609047bba497cbfac5":"markMessagesAsRead","40a7906f8aa07c9fb531f5f0b925fb6f345d7d5820":"closeChatSession","40fcbefe9234e01726fca5e1916b02d83038f4a6d6":"getChatSession","60b514bc9dac2e166e161835b73dc28240aa517c38":"createChatSession","780cfad9819c039b2b6996bc6154909a571b1535f1":"sendChatMessage"},"",""] */ __turbopack_context__.s([
    "closeChatSession",
    ()=>closeChatSession,
    "createChatSession",
    ()=>createChatSession,
    "getActiveChatSessions",
    ()=>getActiveChatSessions,
    "getChatMessages",
    ()=>getChatMessages,
    "getChatSession",
    ()=>getChatSession,
    "markMessagesAsRead",
    ()=>markMessagesAsRead,
    "sendChatMessage",
    ()=>sendChatMessage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function createChatSession(visitorName, visitorEmail) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('chat_sessions').insert({
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        user_id: user?.id || null,
        status: 'active'
    }).select().single();
    if (error) {
        console.error('Error creating chat session:', error);
        return {
            error: error.message
        };
    }
    return {
        success: true,
        session: data
    };
}
async function getChatSession(sessionId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('chat_sessions').select('*').eq('id', sessionId).single();
    if (error) {
        console.error('Error fetching chat session:', error);
        return null;
    }
    return data;
}
async function getActiveChatSessions() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('chat_sessions').select('*').order('last_message_at', {
        ascending: false
    });
    if (error) {
        console.error('Error fetching chat sessions:', error);
        return [];
    }
    return data;
}
async function sendChatMessage(sessionId, message, senderType, senderName) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender_type: senderType,
        sender_name: senderName,
        message: message
    }).select().single();
    if (error) {
        console.error('Error sending message:', error);
        return {
            error: error.message
        };
    }
    return {
        success: true,
        message: data
    };
}
async function getChatMessages(sessionId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at', {
        ascending: true
    });
    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
    return data;
}
async function closeChatSession(sessionId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { error } = await supabase.from('chat_sessions').update({
        status: 'closed',
        updated_at: new Date().toISOString()
    }).eq('id', sessionId);
    if (error) {
        console.error('Error closing chat session:', error);
        return {
            error: error.message
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin/chat');
    return {
        success: true
    };
}
async function markMessagesAsRead(sessionId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Mark all unread visitor messages as read
    await supabase.from('chat_messages').update({
        is_read: true
    }).eq('session_id', sessionId).eq('sender_type', 'visitor').eq('is_read', false);
    // Reset unread count on session
    await supabase.from('chat_sessions').update({
        unread_count: 0
    }).eq('id', sessionId);
    return {
        success: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createChatSession,
    getChatSession,
    getActiveChatSessions,
    sendChatMessage,
    getChatMessages,
    closeChatSession,
    markMessagesAsRead
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createChatSession, "60b514bc9dac2e166e161835b73dc28240aa517c38", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getChatSession, "40fcbefe9234e01726fca5e1916b02d83038f4a6d6", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getActiveChatSessions, "00ba9ca8722145ec910340bfde54a94e8b93081338", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(sendChatMessage, "780cfad9819c039b2b6996bc6154909a571b1535f1", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getChatMessages, "4014455e22b76c012584d01728b3a7e44c3d3f72fe", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(closeChatSession, "40a7906f8aa07c9fb531f5f0b925fb6f345d7d5820", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(markMessagesAsRead, "402f3190d29c01c111be5483609047bba497cbfac5", null);
}),
"[project]/src/app/actions/shipment.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40b1785065668ace62bf3dd06a6fc5312095acdac4":"createShipment"},"",""] */ __turbopack_context__.s([
    "createShipment",
    ()=>createShipment
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function createShipment(formData) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Check for logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('shipments').insert({
        user_id: user?.id || null,
        sender_info: {
            name: formData.sender_name,
            email: formData.sender_email,
            address: formData.sender_address
        },
        receiver_info: {
            name: formData.receiver_name,
            email: formData.receiver_email,
            address: formData.receiver_address
        },
        parcel_details: {
            description: formData.parcel_description,
            weight: formData.parcel_weight
        },
        status: 'pending',
        payment_status: 'unpaid',
        history: [
            {
                status: 'pending',
                location: 'System',
                timestamp: new Date().toISOString(),
                note: 'Shipment created'
            }
        ]
    }).select().single();
    if (error) {
        console.error('Error creating shipment:', error);
        return {
            error: 'Failed to create shipment. Please try again.'
        };
    }
    // Trigger Email Notification (Non-blocking) - Notify BOTH sender and receiver
    try {
        const { sendShipmentCreatedEmail, sendShipmentReceiverNotification } = await __turbopack_context__.A("[project]/src/lib/email.ts [app-rsc] (ecmascript, async loader)");
        // Notify sender
        await sendShipmentCreatedEmail(formData.sender_email, data?.tracking_number || 'N/A', formData.sender_name);
        // Notify receiver that a package is coming their way
        if (formData.receiver_email) {
            await sendShipmentReceiverNotification(formData.receiver_email, data?.tracking_number || 'N/A', formData.receiver_name, formData.sender_name);
        }
    } catch (emailError) {
        console.error('Failed to send creation email:', emailError);
    // We don't fail the whole action if email fails
    }
    return {
        success: true,
        tracking_number: data.tracking_number
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createShipment
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createShipment, "40b1785065668ace62bf3dd06a6fc5312095acdac4", null);
}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions/chat.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/actions/shipment.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$chat$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/chat.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$shipment$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/shipment.ts [app-rsc] (ecmascript)");
;
;
;
;
}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions/chat.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/app/actions/shipment.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "4014455e22b76c012584d01728b3a7e44c3d3f72fe",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$chat$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getChatMessages"],
    "40b1785065668ace62bf3dd06a6fc5312095acdac4",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$shipment$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createShipment"],
    "60b514bc9dac2e166e161835b73dc28240aa517c38",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$chat$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createChatSession"],
    "780cfad9819c039b2b6996bc6154909a571b1535f1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$chat$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendChatMessage"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2f$chat$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2f$shipment$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => "[project]/src/app/actions/chat.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/app/actions/shipment.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$chat$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/chat.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$shipment$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/shipment.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_9b065ab4._.js.map