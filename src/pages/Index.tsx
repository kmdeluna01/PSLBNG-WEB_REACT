import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { products } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UploadProduct from "@/components/UploadProduct";
import axios from "axios";
const baseURL = import.meta.env.VITE_API_URL || '';

export default function Index() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const vendorId = localStorage.getItem("vendorId");
  const [userProducts, setUserProducts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

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

  const getUserProducts = async () => {
    setIsRefreshing(true);
    if (vendorId) {
      try {
        const res = await axios.get(`${baseURL}/merchant/${vendorId}/get-products`);
        if (res.data.data && Array.isArray(res.data.data)) {
          fetchProductDetails(res.data.data);
        } else {
          console.error("Products data is not an array:", res.data.data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }
    setIsRefreshing(false);
  };

  const fetchProductDetails = async (productIds) => {
    try {
      const productRequests = productIds.map((productId) =>
        axios.get(`${baseURL}/product-details/${productId}`)
      );
      const responses = await Promise.all(productRequests);
      const products = responses.map((response) => response.data.data);
      setUserProducts(products);
    } catch (error) {
      console.error("Error fetching product details: ", error);
    }
  };

  const onRefresh = () => {
    getUserProducts();
  };

  useEffect(() => {
    getUserProducts();
  }, []);


  const handleAddProduct = () => {
    setIsDialogOpen(true);
  };


  const renderContent = () => {
    if (isLoading || isRefreshing) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden shadow-lg rounded-lg">
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

    if (!userProducts || userProducts.length === 0) {
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {userProducts.map((product) => (
          <button
            key={product._id}
            className="overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow"
            onClick={() => navigate(`/products/${product._id}/edit`)}
          >
            <Card className="overflow-hidden">
              {product.image && (
                <div className="relative h-48 w-full">
                  <img
                    src={`${baseURL}/uploads/${product.image}`}
                    alt={product.productName}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="text-left">
                <CardTitle className="text-xl text-vendor-800">{product.productName}</CardTitle>
                <p className="text-vendor-600 font-medium">
                  ₱{product.price ? product.price.toLocaleString() : "N/A"}
                </p>
                <p className="text-sm text-vendor-500">Stock: {product.quantity}</p>
              </CardHeader>
              <CardContent className="text-left">
                <p className="text-vendor-600 text-sm line-clamp-2">{product.description}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-2 space-y-2">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-vendor-800">Products</h1>
        <Button onClick={handleAddProduct} variant="custom">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      {renderContent()}
      <UploadProduct
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onProductUploaded={getUserProducts}
      />

    </div>
  );
}