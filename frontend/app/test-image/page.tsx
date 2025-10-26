'use client'

import { useState, useEffect } from 'react'

export default function TestImage() {
  const [listings, setListings] = useState<any[]>([])
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
    // Fetch listings directly
    fetch('http://localhost:8080/api/listings')
      .then(res => res.json())
      .then(data => {
        console.log('Raw API response:', data)
        setListings(data.listings)
        
        // Find first listing with images
        const listingWithImage = data.listings.find((l: any) => l.images)
        if (listingWithImage) {
          console.log('Found listing with images:', listingWithImage.images)
          try {
            const imageArray = JSON.parse(listingWithImage.images)
            if (imageArray.length > 0) {
              const rawUrl = imageArray[0]
              console.log('Raw image URL:', rawUrl)
              
              if (rawUrl.startsWith('/uploads/')) {
                const filename = rawUrl.replace('/uploads/', '')
                const encodedFilename = encodeURIComponent(filename)
                const fullUrl = `http://localhost:8080/uploads/${encodedFilename}`
                console.log('Constructed URL:', fullUrl)
                setImageUrl(fullUrl)
              }
            }
          } catch (e) {
            console.error('Error parsing images:', e)
          }
        }
      })
      .catch(err => console.error('Fetch error:', err))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Image Debug Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Raw API Data:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(listings, null, 2)}
        </pre>
      </div>

      {imageUrl && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Constructed Image URL:</h2>
          <p className="bg-blue-100 p-2 rounded break-all">{imageUrl}</p>
          
          <h3 className="text-md font-semibold mt-4">Direct URL Test:</h3>
          <a href={imageUrl} target="_blank" className="text-blue-600 underline">
            Open image in new tab
          </a>
          
          <h3 className="text-md font-semibold mt-4">Image Element Test:</h3>
          <div className="border-2 border-gray-300 w-64 h-64 bg-gray-100">
            <img
              src={imageUrl}
              alt="Test"
              className="w-full h-full object-cover"
              onLoad={() => console.log('✅ Image loaded successfully')}
              onError={(e) => {
                console.error('❌ Image failed to load')
                console.error('Error event:', e)
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-lg font-semibold">Direct Backend Test:</h2>
        <p>Try these URLs directly in browser:</p>
        <ul className="list-disc ml-6">
          <li>
            <a href="http://localhost:8080/uploads/test.txt" target="_blank" className="text-blue-600 underline">
              http://localhost:8080/uploads/test.txt
            </a>
          </li>
          <li>
            <a href="http://localhost:8080/uploads/WhatsApp%20Image%202025-10-25%20at%2021.42.39-1761512417324-503751942.jpeg" target="_blank" className="text-blue-600 underline">
              Encoded image URL
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}