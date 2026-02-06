import React from 'react';
import { useOS } from '../../contexts/OSContext';
import Icon from '../os/Icon';

interface FolderWindowProps {
  folderId: string;
}

const FolderWindow: React.FC<FolderWindowProps> = ({ folderId }) => {
  const { files } = useOS();
  
  // Filter files that belong to this folder
  const folderContents = files.filter(f => f.parentId === folderId);

  return (
    <div className="w-full h-full bg-[#0f172a] p-4 overflow-auto">
       <div className="grid grid-cols-4 gap-4">
          {folderContents.length === 0 && (
              <div className="col-span-4 text-white/30 text-center italic mt-10">
                  This folder is empty. Drag items here!
              </div>
          )}
          {folderContents.map(item => (
              <Icon key={item.id} item={item} />
          ))}
       </div>
    </div>
  );
};

export default FolderWindow;
