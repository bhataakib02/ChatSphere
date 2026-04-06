import { Check, CheckCheck } from 'lucide-react';

const MessageItem = ({ message, isOwn }: any) => {
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] group`}>
                {!isOwn && (
                    <p className="text-[10px] text-slate-500 mb-1 ml-1">{message.senderName}</p>
                )}
                <div
                    className={`px-4 py-2.5 rounded-2xl relative ${isOwn
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 rounded-tl-none'
                        }`}
                >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                        <span className="text-[9px]">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwn && (
                            <span className="ml-1">
                                {message.status === 'SEEN' ? (
                                    <CheckCheck size={12} className="text-blue-300" />
                                ) : message.status === 'DELIVERED' ? (
                                    <CheckCheck size={12} />
                                ) : (
                                    <Check size={12} />
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
