'use client';

import React, { useState, useEffect } from 'react';
import { FaFile, FaTimes } from 'react-icons/fa';

type FileNode = {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];  // Only present for directories
  path: string;
};

type FileTreeProps = {
  data: FileNode;
  onSelect: (selectedFiles: string[]) => void;
};

type FileTreeNodeProps = {
  node: FileNode;
  onSelect: (selectedFiles: string[]) => void;
  selectedFiles: Set<string>;
  setSelectedFiles: (files: Set<string>) => void;
  currentPath: string[];
};

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, onSelect, selectedFiles, setSelectedFiles, currentPath }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fullPath = [...currentPath, node.name].join('/');

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'file') {
      const newSelectedFiles = new Set(selectedFiles);
      if (newSelectedFiles.has(node.path)) {
        newSelectedFiles.delete(node.path);
      } else {
        newSelectedFiles.add(node.path);
      }
      setSelectedFiles(newSelectedFiles);
      onSelect(Array.from(newSelectedFiles));
    }
  };

  return (
    <div className="pl-4">
      <div
        className="flex items-center py-1 cursor-pointer hover:bg-gray-100 rounded"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <span className="mr-2 text-gray-500">
          {node.type === 'directory' ? '📁' : '📄'}
        </span>
        <span className="text-sm">{node.name}</span>
      </div>
      {node.type === 'directory' && isExpanded && node.children && (
        <div className="pl-4">
          {node.children.map((child, index) => (
            <FileTreeNode
              key={`${fullPath}/${child.name}-${index}`}
              node={child}
              onSelect={onSelect}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              currentPath={[...currentPath, node.name]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ data, onSelect }) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data.children) {
      const files = getAllFiles(data);
      setSelectedFiles(prevFiles => {
        const newFiles = new Set(prevFiles);
        files.forEach(file => newFiles.add(file));
        return newFiles;
      });
    }
  }, [data]);

  const getAllFiles = (node: FileNode): string[] => {
    let files: string[] = [];
    if (node.type === 'file') {
      files.push(node.path);
    } else if (node.children) {
      node.children.forEach(child => {
        files = files.concat(getAllFiles(child));
      });
    }
    return files;
  };

  const handleRemoveFile = (path: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    newSelectedFiles.delete(path);
    setSelectedFiles(newSelectedFiles);
    onSelect(Array.from(newSelectedFiles));
  };

  const handleMixFiles = () => {
    onSelect(Array.from(selectedFiles));
  };

  const getFileName = (path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-medium mb-4">Selected Files</h3>
        <div className="space-y-2">
          {Array.from(selectedFiles).map((path) => (
            <div
              key={path}
              className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center">
                <span className="mr-2 text-gray-500">
                  <FaFile />
                </span>
                <span className="text-sm">{getFileName(path)}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(path);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors">
                <FaTimes />
              </button>
            </div>
          ))}
          {selectedFiles.size === 0 && (
            <div className="text-gray-400 text-sm text-center py-4">
              No files selected
            </div>
          )}
        </div>
        {selectedFiles.size > 0 && (
          <button
            onClick={handleMixFiles}
            className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
            Mix Selected Files
          </button>
        )}
      </div>
    </div>
  );
};