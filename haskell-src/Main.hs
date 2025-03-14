{-# LANGUAGE OverloadedStrings #-}

module Main where

import CopyBuffer
import Foreign.C.String

main :: IO ()
main = do
    putStrLn "Copy Buffer initialized"