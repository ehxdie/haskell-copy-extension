{-# LANGUAGE OverloadedStrings #-}

module CopyBuffer where

import Data.IORef
import Foreign.C.String
import Foreign.Ptr

-- Global buffer
buffer :: IO (IORef String)
buffer = newIORef ""

-- Append to buffer
appendToBuffer :: CString -> IO ()
appendToBuffer cstr = do
    str <- peekCString cstr
    buf <- buffer
    modifyIORef buf (\old -> old ++ "\n" ++ str)

-- Get buffer
getBuffer :: IO CString
getBuffer = do
    buf <- buffer
    str <- readIORef buf
    newCString str

-- Clear buffer
clearBuffer :: IO ()
clearBuffer = do
    buf <- buffer
    writeIORef buf ""

-- Export functions
foreign export javascript "appendToBuffer" appendToBuffer :: CString -> IO ()
foreign export javascript "getBuffer" getBuffer :: IO CString
foreign export javascript "clearBuffer" clearBuffer :: IO ()