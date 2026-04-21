export const profileController = {
  async getOwnProfile(req, res, next) {
    try {
      const data = await profileService.getOwnProfile(req.user);
      return successResponse(res, data, "Profile loaded");
    } catch (error) {
      next(error);
    }
  },

  async updateOwnProfile(req, res, next) {
    try {
      const data = await profileService.updateOwnProfile(req.user, req.body);
      return successResponse(res, data, "Profile updated");
    } catch (error) {
      next(error);
    }
  },

  async suspendOwnProfile(req, res, next) {
    try {
      
      if (req.user.roles.includes("Admin")) {
        return res.status(403).json({
          success: false,
          message: "Admins cannot suspend their own account"
        });
      }

      const data = await profileService.suspendOwnProfile(req.user);

      return successResponse(res, data, "Account suspended");
    } catch (error) {
      next(error);
    }
  }
};
