import axios from "@/lib/axios";
import { createContext, useContext, useState } from "react";

const CampaignContext = createContext();

export const useCampaign = () => {
    const context = useContext(CampaignContext);
    if (!context) {
        throw new Error("useCampaign must be used within CampaignProvider");
    }
    return context;
};

export const CampaignProvider = ({ children }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleError = (err) => {
        const errorMsg = err?.message || err?.response?.data?.message || "Something went wrong";
        setError(errorMsg);
        return errorMsg;
    };

    /**
     * Fetch user campaigns with pagination and filters
     */
    const fetchCampaigns = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: params.page || 1,
                limit: params.limit || 20,
                ...(params.status && { status: params.status }),
                ...(params.type && { type: params.type }),
            });

            const response = await axios.get(`/message/campaigns?${queryParams}`);

            setCampaigns(response.data.data);
            return response.data;
        } catch (err) {
            const errorMsg = handleError(err);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get single campaign by ID
     */
    const getCampaignById = async (campaignId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/message/campaigns/${campaignId}`);
            return response.data.data;
        } catch (err) {
            const errorMsg = handleError(err);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Send single message
     */
    const sendMessage = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${API_BASE}/api/message/send`,
                formData,
                {
                    ...getAuthHeaders(),
                    headers: {
                        ...getAuthHeaders().headers,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // Refresh campaigns list
            await fetchCampaigns();

            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to send message";
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Send bulk messages
     */
    const sendBulkMessage = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${API_BASE}/api/message/bulk`,
                formData,
                {
                    ...getAuthHeaders(),
                    headers: {
                        ...getAuthHeaders().headers,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // Refresh campaigns list
            await fetchCampaigns();

            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to send bulk messages";
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cancel a campaign
     */
    const cancelCampaign = async (campaignId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${API_BASE}/api/message/campaigns/${campaignId}/cancel`,
                {},
                getAuthHeaders()
            );

            // Refresh campaigns list
            await fetchCampaigns();

            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to cancel campaign";
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        campaigns,
        loading,
        error,
        fetchCampaigns,
        getCampaignById,
        sendMessage,
        sendBulkMessage,
        cancelCampaign,
    };

    return (
        <CampaignContext.Provider value={value}>
            {children}
        </CampaignContext.Provider>
    );
};