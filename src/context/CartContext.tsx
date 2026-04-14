'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { CartItem } from '@/types'

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productoId: string) => void
  updateQuantity: (productoId: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  count: 0,
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('ferreteria_cart')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('ferreteria_cart', JSON.stringify(items))
  }, [items])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productoId === item.productoId)
      if (existing) {
        return prev.map((i) =>
          i.productoId === item.productoId
            ? { ...i, cantidad: Math.min(i.cantidad + item.cantidad, item.stock) }
            : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId))
  }, [])

  const updateQuantity = useCallback((productoId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productoId !== productoId))
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: quantity } : i))
      )
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const count = items.reduce((sum, i) => sum + i.cantidad, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
