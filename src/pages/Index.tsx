
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { products } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Index() {
  const { toast } = useToast();
  const vendorId = localStorage.getItem("vendorId");

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ["products", vendorId],
    queryFn: () => products.getVendorProducts(vendorId!),
    enabled: !!vendorId,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleAddProduct = () => {
    // This will be implemented in the next step
    console.log("Add product clicked");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      );
    }

    if (!productData?.data || productData.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-vendor-600">No Products</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-vendor-500">
              You haven't added any products yet.
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productData.data.map((product: any) => (
          <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {product.image && (
              <div className="relative h-48 w-full">
                <img
                  src={`https://pslbng-mobile-1.onrender.com/${product.image}`}
                  alt={product.productName}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl text-vendor-800">{product.productName}</CardTitle>
              <p className="text-vendor-600 font-medium">₱{product.price.toLocaleString()}</p>
              <p className="text-sm text-vendor-500">Stock: {product.quantity}</p>
            </CardHeader>
            <CardContent>
              <p className="text-vendor-600 text-sm line-clamp-2">{product.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-vendor-800">Products</h1>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      {renderContent()}
    </div>
  );
}
