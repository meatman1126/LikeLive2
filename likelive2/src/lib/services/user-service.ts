/**
 * ユーザーサービスクラス
 */

import { prisma } from '../prisma/client';
import { NotFoundError } from '../utils/errors';
import type { User } from '@/generated/prisma/client';
import { findFavoriteArtistsByUserId } from './user-artist-service';
import { findPublishedBlogsByUserId } from './blog-service';
import { countFollowedUsers, countFollowers, isFollowing } from './follow-service';
import { saveArtist, saveArtistsBatch } from './artist-service';
import type { ProfileViewDto } from '@/types/profile';
import type { UserUpdateForm, UserRegistrationForm } from '../validations/user-validation';

/**
 * subjectに紐づくユーザー情報を取得します。
 *
 * @param subject ユーザー毎のid
 * @returns ユーザー情報または null
 */
export async function findUserBySubject(subject: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { subject },
  });
}

/**
 * 指定されたユーザー情報を取得します。
 *
 * @param id ユーザーID
 * @returns ユーザー情報
 * @throws NotFoundError ユーザーが取得できない場合
 */
export async function getUserById(id: number): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  
  if (!user) {
    throw new NotFoundError(`User not found with id: ${id}`);
  }
  
  return user;
}

/**
 * ユーザーを新規登録します。
 *
 * @param subject GoogleのユーザーID（sub）
 * @param displayName 表示名
 * @returns 登録されたユーザー情報
 */
export async function registerUser(
  subject: string,
  displayName?: string
): Promise<User> {
  return prisma.user.create({
    data: {
      subject,
      displayName: displayName || null,
      enabled: true,
      createdBy: 'System',
      updatedBy: 'System',
    },
  });
}

/**
 * ユーザーのプロフィール、アーティスト、ブログ情報を取得します。
 *
 * @param userId ユーザーID
 * @param isOthersInfo 他ユーザの情報を取得する場合true
 * @param currentUserId 現在のユーザーID（フォロー状況を確認するために使用）
 * @returns ユーザーのプロフィール情報
 */
export async function getUserProfile(
  userId: number,
  isOthersInfo: boolean,
  currentUserId?: number
): Promise<ProfileViewDto> {
  const userInfo = await getUserById(userId);
  
  const [favoriteArtistList, createdBlogList, followedCount, followerCount] = await Promise.all([
    findFavoriteArtistsByUserId(userInfo.id),
    findPublishedBlogsByUserId(userInfo.id),
    countFollowedUsers(userInfo.id),
    countFollowers(userInfo.id),
  ]);
  
  // フォロー状況を取得（ログインユーザ自身の情報を取得する場合はnull）
  let isFollow: boolean | null = null;
  if (isOthersInfo && currentUserId !== undefined) {
    isFollow = await isFollowing(currentUserId, userId);
  }
  
  return {
    userId: userInfo.id,
    displayName: userInfo.displayName,
    profileImageUrl: userInfo.profileImageUrl,
    selfIntroduction: userInfo.selfIntroduction,
    favoriteArtistList,
    createdBlogList,
    followedCount,
    followerCount,
    isFollow,
  };
}

/**
 * ユーザープロフィール情報を更新します。
 * ファイルアップロードは後で実装します。
 *
 * @param userId ユーザーID
 * @param form ユーザー更新情報
 * @param updatedBy 更新者ID
 * @returns 更新されたユーザー情報
 */
export async function updateUserProfile(
  userId: number,
  form: UserUpdateForm,
  updatedBy: string
): Promise<User> {
  // ユーザー情報の更新
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: form.displayName,
      selfIntroduction: form.selfIntroduction,
      profileImageUrl: form.profileImageUrl,
      updatedBy,
    },
  });
  
  // ユーザー、アーティストリレーション情報のリセット（全削除）
  await prisma.userArtist.deleteMany({
    where: { userId },
  });
  
  // アーティスト情報の登録（バッチ処理で最適化）
  if (form.favoriteArtistList && form.favoriteArtistList.length > 0) {
    const validArtists = form.favoriteArtistList.filter(artistData => artistData);
    
    if (validArtists.length > 0) {
      // アーティストを一括保存
      await saveArtistsBatch(validArtists, updatedBy);
      
      // ユーザーアーティストリレーションを一括作成
      await prisma.userArtist.createMany({
        data: validArtists.map(artistData => ({
          userId,
          artistId: artistData.id,
          createdBy: updatedBy,
          updatedBy,
        })),
        skipDuplicates: true,
      });
    }
  }
  
  return updatedUser;
}

/**
 * ユーザー情報の初期更新を行います。
 * ファイルアップロードは後で実装します。
 *
 * @param userId ユーザーID
 * @param form ユーザー登録情報
 * @param updatedBy 更新者ID
 * @returns 更新されたユーザー情報
 */
export async function initialUpdateUser(
  userId: number,
  form: UserRegistrationForm,
  updatedBy: string
): Promise<User> {
  // ユーザー情報の更新
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: form.userName,
      updatedBy,
    },
  });
  
  // ユーザー、アーティストリレーション情報のリセット（全削除）
  await prisma.userArtist.deleteMany({
    where: { userId },
  });
  
  // アーティスト情報の登録（バッチ処理で最適化）
  if (form.artistList && form.artistList.length > 0) {
    const validArtists = form.artistList.filter(artistData => artistData);
    
    if (validArtists.length > 0) {
      // アーティストを一括保存
      await saveArtistsBatch(validArtists, updatedBy);
      
      // ユーザーアーティストリレーションを一括作成
      await prisma.userArtist.createMany({
        data: validArtists.map(artistData => ({
          userId,
          artistId: artistData.id,
          createdBy: updatedBy,
          updatedBy,
        })),
        skipDuplicates: true,
      });
    }
  }
  
  return updatedUser;
}

/**
 * キーワードに部分一致するユーザーを検索します。
 * 表示名または好きなアーティスト名で検索します。
 *
 * @param keyword 検索キーワード
 * @param currentUserId 現在のユーザーID（検索結果から除外）
 * @returns 該当するユーザーのリスト
 */
export async function searchUsers(
  keyword: string,
  currentUserId: number
): Promise<User[]> {
  if (!keyword || keyword.trim().length === 0) {
    return [];
  }

  const searchKeyword = `%${keyword.trim()}%`;

  type RawRow = {
    id: number;
    display_name: string | null;
    profile_image_url: string | null;
    self_introduction: string | null;
    [key: string]: unknown;
  };

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT DISTINCT u.id, u.display_name, u.profile_image_url, u.self_introduction
    FROM users u
    LEFT JOIN user_artists ua ON u.id = ua.user_id
    LEFT JOIN artists a ON ua.artist_id = a.id
    WHERE (
      u.display_name ILIKE ${searchKeyword}
      OR a.name ILIKE ${searchKeyword}
    )
    AND u.id != ${currentUserId}
    AND u.enabled = true
  `;

  return rows.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    profileImageUrl: row.profile_image_url,
    selfIntroduction: row.self_introduction,
  })) as User[];
}

/**
 * ユーザーを論理削除します（enabled = false）。
 *
 * @param id ユーザーID
 * @param updatedBy 更新者ID
 */
export async function deleteUser(id: number, updatedBy: string): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: {
      enabled: false,
      updatedBy,
    },
  });
}

/**
 * 複数のユーザーを論理削除します。
 *
 * @param ids ユーザーIDリスト
 * @param updatedBy 更新者ID
 */
export async function deleteUsers(ids: number[], updatedBy: string): Promise<void> {
  await prisma.user.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      enabled: false,
      updatedBy,
    },
  });
}
