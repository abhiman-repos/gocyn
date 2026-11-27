"use client";

import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useEffect, useState } from "react";

const API = process.env.APP_URL;

export default function GoogleAuthButton() {
  const router = useRouter();
  const { setUser, refreshUser } = useAuth();
  const [error , setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div> 
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        setError("")

        const googleCredential = credentialResponse.credential;

        if (!googleCredential){
          setError("Google did not return a credential . Please try again");
          return;
        }
        
        if (!API){
          setError("Authentication service is not configured.");
          return;
        }

        setLoading(true);

        try {
          // Send the Google credential to your Django backend
          const res = await axios.post(
            `${API}/api/auth/google/`,
            {
              credential: googleCredential,
            }
          );

          const data = res.data;

          const accessToken = data.access ?? data.token ?? data.access_token;
          const refreshToken = data.refresh;
          // Extract token and user from backend response
          const { token, user } = res.data;

          if (!accessToken){
            throw new Error(
              "The server did not return an access token. "
            );
          }

          localStorage.setItem("token", accessToken);
          if (refreshToken) {
            localStorage.setItem("refresh", refreshToken);
          }

          if (data.user){
            setUser(data.user);
            localStorage.setItem(
              "user",
              JSON.stringify(data.user)

            );
          } else {
            await refreshUser();
          }

          router.replace("/onboarding")
          } catch (err: unknown){
            if (axios.isAxiosError(err)) {
              const responseData = err.response?.data;

              if (responseData?.code === "account_link_required"){
                setError(
                  "An account with this email already exists. Sign in using your Existing method first"

                )
              } else {
                setError(
                  responseData?.detail || "Google sign-in failed . Please Try again."
                )
              }
            } else if ( err instanceof Error) {
              setError(err.message)
            } else {
              setError("Something went wrong. Please try again");
            }

            console.error("Google login failed.")
          } finally {
            setLoading(false)
          // 1. Store token under the key expected by AuthContext
        
          }
        }} 
        onError={() => {
          setError("Google sign-in was cancelled or failed .");

        }}
    />
    {
      loading && (
        <p className="mt-3 text-sm text-slate-500">
          Signing you in ...
        </p>
      )
    }

    {
      error && (
        <p
          role="alert" 
          className="mt-3 text-sm text-red-600"
          >
            {error}
        </p>
      )
    }
    </div>
  );
}
