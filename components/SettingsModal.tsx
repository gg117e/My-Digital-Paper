import React from 'react';
import { X, Download, FileJson, FileText } from 'lucide-react';
import { useDiary } from '../hooks/useDiary';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { exportAllEntries, loading } = useDiary();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">設定</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">データエクスポート</h4>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => exportAllEntries('json')}
                disabled={loading}
                className="flex items-center justify-between w-full p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <FileJson size={20} className="text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-800">JSON形式</div>
                    <div className="text-xs text-gray-500">バックアップ用</div>
                  </div>
                </div>
                <Download size={18} className="text-gray-400 group-hover:text-blue-600" />
              </button>

              <button 
                onClick={() => exportAllEntries('markdown')}
                disabled={loading}
                className="flex items-center justify-between w-full p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                 <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <FileText size={20} className="text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-800">Markdown形式</div>
                    <div className="text-xs text-gray-500">他のノートアプリへ移行</div>
                  </div>
                </div>
                <Download size={18} className="text-gray-400 group-hover:text-blue-600" />
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              データはブラウザのローカルストレージに保存されています。<br/>
              キャッシュを削除するとデータが消える可能性があります。<br/>
              こまめにエクスポートしてください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};