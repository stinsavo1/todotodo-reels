import { doc, Firestore, getDoc, updateDoc } from "@angular/fire/firestore";
import { inject, Injectable } from "@angular/core";

export interface Branch {
  name: string;
  address: string;
  geometry: string[];
  id: string;
}

@Injectable()
export class BranchesService {
  private firestore: Firestore = inject(Firestore);


  async addBranchToUser(userId: string, mode: string, branch: Branch): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);

    try {
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as any;
        if (mode === 'factory') {
          const currentBranches = userData.branchesFactory || [];

          await updateDoc(userDocRef, {
            branchesFactory: [...currentBranches, branch]
          });
        }
        if (mode === 'store') {
          const currentBranches = userData.branches || [];

          await updateDoc(userDocRef, {
            branches: [...currentBranches, branch]
          });
        }

      } else {
        if (mode === 'factory') {
          await updateDoc(userDocRef, {
            branchesFactory: [branch]
          });
        }
        if (mode === 'store') {
          await updateDoc(userDocRef, {
            branches: [branch]
          });
        }

      }
    } catch (error) {
      console.error("Ошибка при добавлении филиала:", error);
      throw error;
    }
  }

  async removeBranchFromUser(userId: string, mode: string, branchId: string): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);

    try {
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as any;
        if (mode === 'factory') {
          const currentBranches = userData.branchesFactory || [];

          // Фильтруем массив, исключая филиал с указанным id
          const updatedBranches = currentBranches.filter(
            (branch: Branch) => branch.id !== branchId
          );

          // Обновляем документ
          await updateDoc(userDocRef, {
            branchesFactory: updatedBranches
          });
        }
        if (mode === 'store') {
          const currentBranches = userData.branches || [];

          // Фильтруем массив, исключая филиал с указанным id
          const updatedBranches = currentBranches.filter(
            (branch: Branch) => branch.id !== branchId
          );

          // Обновляем документ
          await updateDoc(userDocRef, {
            branches: updatedBranches
          });
        }
      } else {
        console.warn(`Пользователь с id ${userId} не найден.`);
      }
    } catch (error) {
      console.error(`Ошибка при удалении филиала с id ${branchId}:`, error);
      throw error;
    }
  }

  async updateBranchInUser(userId: string, mode: string, updatedBranch: Branch): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);

    try {
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as any;
        if (mode === 'factory') {
          const currentBranches = userData.branchesFactory || [];

          const updatedBranches = currentBranches.map((branch: Branch) =>
            branch.id === updatedBranch.id ? { ...branch, ...updatedBranch } : branch
          );

          await updateDoc(userDocRef, {
            branchesFactory: updatedBranches
          });
        }
        if (mode === 'store') {
          const currentBranches = userData.branches || [];

          const updatedBranches = currentBranches.map((branch: Branch) =>
            branch.id === updatedBranch.id ? { ...branch, ...updatedBranch } : branch
          );

          await updateDoc(userDocRef, {
            branches: updatedBranches
          });
        }
      } else {
        console.warn(`Пользователь с id ${userId} не найден.`);
      }
    } catch (error) {
      console.error(`Ошибка при обновлении филиала с id ${updatedBranch.id}:`, error);
      throw error;
    }
  }
}
