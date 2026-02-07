'use client';

interface Product {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
}

interface ProductSelectorProps {
  products: Product[];
  activeProductId: string;
  onProductSelect: (productId: string) => void;
  disabled?: boolean;
}

export default function ProductSelector({
  products,
  activeProductId,
  onProductSelect,
  disabled = false,
}: ProductSelectorProps) {
  const handleProductClick = (productId: string) => {
    if (disabled || productId === activeProductId) return;

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    onProductSelect(productId);
  };

  return (
    <div
      className="product-selector"
      style={{
        position: 'fixed',
        bottom: '110px', // Above category navigation
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        padding: '8px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 25,
        maxWidth: '90%',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {products.map((product) => {
        const isActive = product.id === activeProductId;

        return (
          <button
            key={product.id}
            onClick={() => handleProductClick(product.id)}
            disabled={disabled}
            style={{
              minWidth: '64px',
              height: '64px',
              padding: 0,
              background: isActive
                ? 'rgba(0, 240, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.05)',
              border: isActive
                ? '2px solid #00f0ff'
                : '2px solid transparent',
              borderRadius: '12px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              overflow: 'hidden',
              transition: 'all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              transform: isActive ? 'scale(1)' : 'scale(0.95)',
              boxShadow: isActive
                ? '0 0 12px rgba(0, 240, 255, 0.4)'
                : 'none',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <img
              src={product.thumbnail}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </button>
        );
      })}

      <style jsx>{`
        .product-selector::-webkit-scrollbar {
          display: none;
        }

        .product-selector button:hover:not(:disabled) {
          transform: scale(1);
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .product-selector button:active:not(:disabled) {
          transform: scale(0.9);
        }
      `}</style>
    </div>
  );
}

export type { Product };
