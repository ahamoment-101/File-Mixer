'use client';

import { useState, useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { FileTree } from './components/FileTree';
import { FaXTwitter } from 'react-icons/fa6';

type FileNode = {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  file?: File;
};

type FileTreeData = FileNode & {
  type: 'directory';
  children: FileNode[];
};

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showFileTree, setShowFileTree] = useState(false);
  const [fileTreeData, setFileTreeData] = useState<FileTreeData | null>(null);
  const [isDirectoryMode] = useState(true);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setError('');
    try {
      const textContents: string[] = [];
      
      for (const file of files) {
        const text = await file.text();
        const separator = '='.repeat(50);
        const header = `${separator}\nFile: ${file.name}\n${separator}\n\n`;
        textContents.push(header + text);
      }

      const combinedContent = textContents.join('\n\n');
      const blob = new Blob([combinedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'combined.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error occurred during file processing, please try again');
      console.error(err);
    } finally {
      setIsProcessing(false);
      setShowFileTree(false);
      setFileTreeData(null);
    }
  };

  const handleFileTreeSelect = async (selectedFiles: string[]) => {
    if (selectedFiles.length === 0) return;
    const selectedFileObjects = selectedFiles.map(path => {
      const node = findFileNode(fileTreeData, path);
      return node?.file;
    }).filter((file): file is File => file instanceof File);

    if (selectedFileObjects.length > 0) {
      processFiles(selectedFileObjects);
    }
  };

  const findFileNode = (node: FileNode | null, path: string): FileNode | null => {
    if (!node) return null;
    if (node.type === 'file' && node.path === path) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findFileNode(child, path);
        if (found) return found;
      }
    }
    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFileTypes = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.html', '.css', '.py', '.java', '.cpp', '.c', '.go', '.rb', '.php'];
    const validFiles = acceptedFiles.filter(file => {
      const extension = file.name.toLowerCase().split('.').pop() || '';
      return validFileTypes.some(type => type.slice(1) === extension);
    });

    if (validFiles.length === 0) {
      setError('Please select supported file types');
      return;
    }
    
    const buildFileTree = (files: File[]): FileTreeData => {
      const root: FileTreeData = {
        name: 'Root',
        type: 'directory',
        path: '/',
        children: []
      };

      files.forEach(file => {
        const path = file.webkitRelativePath || file.name;
        const parts = path.split('/');
        let current = root;

        parts.forEach((part, index) => {
          if (index === parts.length - 1) {
            current.children.push({
              name: part,
              type: 'file' as const,
              path: file.name,
              file: file // 存储文件对象以供后续处理
            });
          } else {
            let child = current.children.find(c => c.name === part && c.type === 'directory') as FileNode & { type: 'directory'; children: FileNode[] } | undefined;
            if (!child) {
              child = {
                name: part,
                type: 'directory' as const,
                path: parts.slice(0, index + 1).join('/'),
                children: []
              };
              current.children.push(child);
            }
            current = child;
          }
        });
      });

      return root;
    };

    setFileTreeData(buildFileTree(validFiles));
    setShowFileTree(true);
  }, []);

  type CustomDropzoneOptions = DropzoneOptions & {
    webkitdirectory?: string | boolean;
    directory?: string;
    mozdirectory?: string;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
    accept: undefined
  } as CustomDropzoneOptions);

  const inputProps = getInputProps();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">File Mixer</h1>
      <div
        {...getRootProps()}
        className={`w-full max-w-2xl p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...inputProps} />
        {isProcessing ? (
          <p className="text-gray-600">Processing...</p>
        ) : (
          <p className="text-gray-600">
            {isDragActive
              ? 'Release to upload files'
              : isDirectoryMode
                ? 'Drag and drop folder here'
                : 'Drag and drop files here'}
          </p>
        )}
      </div>

      {showFileTree && fileTreeData && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Select files to merge:</h2>
          <FileTree data={fileTreeData} onSelect={handleFileTreeSelect} />
        </div>
      )}

      {error && (
        <p className="mt-4 text-red-500">{error}</p>
      )}

      <p className="mt-4 text-sm text-gray-500">
        Supported file types: TXT, MD, JSON, JS, TS, TSX, HTML, CSS, Python (.py), Java (.java), C++ (.cpp), C (.c), Go (.go), Ruby (.rb), PHP (.php)
      </p>
      <a href="https://x.com/darrenlopez001"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 mb-8 inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
        <FaXTwitter className="w-5 h-5" />
         Follow me at X
      </a>
    </div>
  );
}
