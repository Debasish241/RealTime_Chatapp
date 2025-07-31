"use client";

import Loading from "@/components/Loading";
import { useAppData, user_service } from "@/context/AppContext";
import axios from "axios";
import Cookies from "js-cookie";
import { ArrowLeft, Save, User, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user, isAuth, loading, setUser } = useAppData();
  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState<string | undefined>("");
  const router = useRouter();

  const editHandler = () => {
    setIsEdit(!isEdit);
    setName(user?.name);
  };

  const submitHandler = async (e: any) => {
    e.preventDefault();
    const token = Cookies.get("token");

    try {
      const response = await axios.post(
        `${user_service}/api/v1/update/user`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data;

      // Optionally update token only if it exists
      if (data?.token) {
        Cookies.set("token", data.token, {
          expires: 15,
          secure: false,
          path: "/",
        });
      }

      toast.success(data.message);
      setUser(data.user); // Correctly set the full user object
      setIsEdit(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  if (loading) return <Loading />;
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-8 ">
        <div className="flex items-center gap-4 mb-8">
          <button
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700"
            onClick={() => {
              router.push("/chat");
            }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-300 " />
          </button>
          <div>
            <h1 className="text3xl font-bold text-white">Profile Settings</h1>
            <p className="text-gray-400 mt-1 ">
              Manage your Acccount Information
            </p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg border-gray-700 border shadow-lg">
          <div className="bg-gray-700 p-8 border-b border-gray-600 ">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center">
                  <UserCircle className="w-12 h-12 text-gray-300 " />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800 "></div>
              </div>
              <div className="flex-1 ">
                <h2 className=" text-2xl  font-bold text-white mb-1 ">
                  {user?.name || "User"}
                </h2>
                <p className="text-gray-300 text-sm ">Active Now</p>
              </div>
            </div>
          </div>
          <div className="p-8 ">
            <div className="space-y-6 ">
              <div>
                <label className="block text-sm font-semibold text bg-gray-800 text-white mb-3">
                  {" "}
                  Display Name
                </label>
                {isEdit ? (
                  <form onSubmit={submitHandler} className="space-y-4 ">
                    <div className="relative ">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4  py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 "
                      />
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 " />
                    </div>

                    <div className="flex  gap-3 ">
                      <button
                        type="submit"
                        className=" flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button
                        className=" flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-gray-700 text-white font-semibold rounded-lg"
                        type="button"
                        onClick={editHandler}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 ">
                    <span className="text-white font-medium text-lg ">
                      {user?.name || "Not Set"}
                    </span>
                    <button
                      className=" flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-gray-700 text-white font-semibold rounded-lg"
                      onClick={editHandler}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
