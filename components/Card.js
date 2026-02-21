import { useState, useRef, useCallback, useEffect } from 'react'

export default function Card({
    children,
    className = '',
    tags = [],
    activeFilters = [],
    locked = false,
    accent = 'blue',
    style = {},
}) {
    const cardRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    const isFiltered =
        activeFilters.length > 0 &&
        !tags.some((t) => activeFilters.includes(t))

    const handleMouseDown = useCallback(
        (e) => {
            if (locked) return
            e.preventDefault()
            setIsDragging(true)
            setDragStart({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
            })
        },
        [locked, dragOffset]
    )

    const handleMouseMove = useCallback(
        (e) => {
            if (!isDragging) return
            const newX = e.clientX - dragStart.x
            const newY = e.clientY - dragStart.y
            setDragOffset({ x: newX, y: newY })
        },
        [isDragging, dragStart]
    )

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleTouchStart = useCallback(
        (e) => {
            if (locked) return
            const touch = e.touches[0]
            setIsDragging(true)
            setDragStart({
                x: touch.clientX - dragOffset.x,
                y: touch.clientY - dragOffset.y,
            })
        },
        [locked, dragOffset]
    )

    const handleTouchMove = useCallback(
        (e) => {
            if (!isDragging) return
            e.preventDefault()
            const touch = e.touches[0]
            const newX = touch.clientX - dragStart.x
            const newY = touch.clientY - dragStart.y
            setDragOffset({ x: newX, y: newY })
        },
        [isDragging, dragStart]
    )

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false)
    }, [])

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            window.addEventListener('touchmove', handleTouchMove, { passive: false })
            window.addEventListener('touchend', handleTouchEnd)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

    const cardClasses = [
        'card',
        className,
        isDragging ? 'dragging' : '',
        locked ? 'locked' : '',
        isFiltered ? 'filtered-out' : '',
        activeFilters.length > 0 && !isFiltered ? 'filtered-in' : '',
    ]
        .filter(Boolean)
        .join(' ')

    const cardStyle = {
        ...style,
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)${isDragging ? ' scale(1.03)' : ''
            }`,
        zIndex: isDragging ? 1000 : style.zIndex || 'auto',
        transition: isDragging ? 'none' : undefined,
    }

    return (
        <div
            ref={cardRef}
            className={cardClasses}
            style={cardStyle}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <div className={`card-accent ${accent}`} />
            {children}
        </div>
    )
}
