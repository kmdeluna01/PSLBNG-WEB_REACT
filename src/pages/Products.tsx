import { useEffect, useState } from "react"; // Importing React hooks
import { useQuery } from "@tanstack/react-query"; // Importing React Query hook for fetching data
import { products } from "@/services/api"; // Importing the API service for product data
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Importing UI components for card styling
import { Skeleton } from "@/components/ui/skeleton"; // Importing Skeleton component for loading state
import { useToast } from "@/hooks/use-toast"; // Importing custom hook for showing toasts
import { Button } from "@/components/ui/button"; // Importing Button component
import { Star, Plus, MessageSquareText, X, CircleUserRound } from "lucide-react"; // Importing icons
import { useNavigate } from "react-router-dom"; // Importing React Router's useNavigate hook for navigation
import UploadProduct from "@/components/UploadProduct"; // Importing UploadProduct component
import axios from "axios"; // Importing axios for making API requests

const baseURL = import.meta.env.VITE_API_URL || ""; // Setting the base API URL from environment variables

export default function Products() {
  // State hooks for managing various parts of the component's state
  const [isDialogOpen, setIsDialogOpen] = useState(false); // For controlling dialog visibility
  const { toast } = useToast(); // For showing toast notifications
  const navigate = useNavigate(); // For navigating between pages
  const vendorId = localStorage.getItem("vendorId"); // Getting vendor ID from local storage
  const [userProducts, setUserProducts] = useState([]); // Storing the list of user products
  const [isRefreshing, setIsRefreshing] = useState(false); // For managing refresh state
  const [selectedComments, setSelectedComments] = useState([]); // For managing selected comments
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false); // For managing comments modal state

  // Effect to ensure user is logged in, redirects to home if not
  useEffect(() => {
    const token = localStorage.getItem("token"); // Check for token in local storage
    if (!token) {
      navigate("/"); // Redirect to home if no token found
    }
  }, [navigate]); // Effect triggers on navigate change

  // Fetching vendor products using React Query's useQuery hook
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ["products", vendorId], // Query key for cache management
    queryFn: () => products.getVendorProducts(vendorId!), // API call to fetch products
    enabled: !!vendorId, // Only run the query if vendorId exists
  });

  // Effect to show error toast if fetching products fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive", // Toast variant for errors
      });
    }
  }, [error, toast]); // Trigger the effect when error changes

  // Function to get user products from API
  const getUserProducts = async () => {
    setIsRefreshing(true); // Set refreshing state to true
    if (vendorId) {
      try {
        const res = await axios.get(`${baseURL}/merchant/${vendorId}/get-products`); // API call to fetch products
        if (res.data.data && Array.isArray(res.data.data)) {
          fetchProductDetails(res.data.data); // Fetch product details if data is an array
        } else {
          console.error("Products data is not an array:", res.data.data); // Log error if data is not an array
        }
      } catch (error) {
        console.error("Error fetching products:", error); // Log error if API request fails
      }
    }
    setIsRefreshing(false); // Set refreshing state to false
  };

  // Function to fetch detailed information about each product
  const fetchProductDetails = async (productIds) => {
    try {
      const productRequests = productIds.map((productId) =>
        axios.get(`${baseURL}/product-details/${productId}`) // Fetch each product's details
      );
      const responses = await Promise.all(productRequests); // Wait for all product requests to complete
      const products = responses.map((response) => response.data.data); // Extract product data
      setUserProducts(products); // Set user products in state
    } catch (error) {
      console.error("Error fetching product details: ", error); // Log error if fetching details fails
    }
  };

  // Fetch user products when component mounts
  useEffect(() => {
    getUserProducts();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to open the product upload dialog
  const handleAddProduct = () => {
    setIsDialogOpen(true); // Open dialog to add product
  };

  // Function to open the comments modal
  const openCommentsModal = (comments) => {
    setSelectedComments(comments || []); // Set the selected comments
    setIsCommentsModalOpen(true); // Open the comments modal
  };

  // Function to close the comments modal
  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false); // Close the comments modal
    setSelectedComments([]); // Clear selected comments
  };

  // Function to render content based on loading, error, or empty state
  const renderContent = () => {
    if (isLoading || isRefreshing) { // Loading state
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

    if (!userProducts || userProducts.length === 0) { // No products state
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

    // Products available state
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 py-4">
        {userProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow w-full cursor-pointer"
            onClick={() => navigate(`/products/${product._id}/edit`)} // Navigate to product edit page
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
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-xl font-semibold text-vendor-800 line-clamp-1">
                    {product.productName}
                  </h3>
                  <div className="text-left flex items-center">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className={`w-4 h-4 ${index < Math.floor(product.ratings?.average)
                          ? "text-yellow-500 fill-yellow-500"
                          : index < product.ratings?.average
                            ? "text-yellow-300 fill-yellow-300"
                            : "text-gray-300"
                          }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      ({product.ratings?.totalRatings || 0})
                    </span>
                  </div>
                </div>

                <div className="flex flex-row justify-between">
                  <p className="text-vendor-600 font-medium">
                    ₱{product.price ? product.price.toLocaleString() : "N/A"}
                  </p>
                  <p className="text-sm text-vendor-500">{product.sold} Sold</p>
                </div>

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
                    openCommentsModal(product.ratings?.reviews); // Open comments for the product
                  }}
                  className="flex py-2 text-gray-600 hover:text-gray-800"
                >
                  <MessageSquareText className="w-5 h-5 cursor-pointer" />
                  <span className="ml-2 text-sm">{product.ratings?.reviews?.length || 0}</span>
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
      {renderContent()} {/* Render content based on loading or available products */}
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
                      <p className="text-sm text-gray-700 mt-1">{comment.comments}</p>
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
