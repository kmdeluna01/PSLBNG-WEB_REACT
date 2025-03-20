import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { products } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquareText, X, CircleUserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UploadProduct from "@/components/UploadProduct";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

export default function Products() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const vendorId = localStorage.getItem("vendorId");
  const [userProducts, setUserProducts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  //console.log("User Products:", userProducts)

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

  useEffect(() => {
    getUserProducts();
  }, []);

  const handleAddProduct = () => {
    setIsDialogOpen(true);
  };

  const openCommentsModal = (comments) => {
    setSelectedComments(comments || []);
    setIsCommentsModalOpen(true);
  };

  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false);
    setSelectedComments([]);
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 py-4">
        {userProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow w-full cursor-pointer"
            onClick={() => navigate(`/products/${product._id}/edit`)}
          >
            <div className="relative rounded-lg">
              {/* Image Section */}
              {product.image && (
                <div className="w-full h-48 md:h-56 lg:h-64">
                  <img
                    src={product.image}
                    alt={product.productName}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>
              )}

              {/* Card Header */}
              <div className="p-4 text-left">
                <h3 className="text-xl font-semibold text-vendor-800 line-clamp-1">
                  {product.productName}
                </h3>
                <p className="text-vendor-600 font-medium">
                  ₱{product.price ? product.price.toLocaleString() : "N/A"}
                </p>
                <p className="text-sm text-vendor-500">Stock: {product.quantity}</p>
              </div>

              {/* Card Content */}
              <div className="p-4 text-left">
                <p className="text-vendor-600 text-sm line-clamp-1">
                  {product.description}
                </p>

                {/* Open Comments Modal Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCommentsModal(product.comments);
                  }}
                  className="flex py-2 text-gray-600 hover:text-gray-800"
                >
                  <MessageSquareText className="w-5 h-5 cursor-pointer" />
                  <span className="ml-2 text-sm">{product.comments?.length || 0}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Products</h2>
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

      {/* Comments Modal */}
      {isCommentsModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/6 max-h-5/6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xl font-semibold">Comments</h3>
              <button onClick={closeCommentsModal}>
                <X className="w-5 h-5 text-gray-600 hover:text-gray-800" />
              </button>
            </div>
            <div className="mt-4 max-h-screen overflow-y-auto">
              {selectedComments.length > 0 ? (
                selectedComments.map((comment, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border-b border-gray-200">
                    <CircleUserRound className="w-6 h-6 text-gray-500" /> {/* Buyer Icon */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {comment.buyer?.nickname || "Unknown User"}
                        </p>
                        <span className="text-xs text-gray-500">{new Date(comment.date).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No comments</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
