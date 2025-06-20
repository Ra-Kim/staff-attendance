import { collection, getDocs } from "firebase/firestore";
import { db } from "@/backend/firebase"; // adjust the path based on your setup
import { IUserBody } from "@/types";

export const fetchUsersByBusinessId = async (businessId: string) => {
  try {
    const usersRef = collection(db, "businesses", businessId, "users");
    const snapshot = await getDocs(usersRef);

    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    return users as IUserBody[];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};
