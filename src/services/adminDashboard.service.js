import IllegalDump from "../model/illegalDump.js";
import Recycling from "../model/recycling.js";
import RewardRedemption from "../model/redemptionReward.js";
import Reward from "../model/rewards.js";
import User from "../model/user.js";
import Waste from "../model/wastecollection.js";


export const getAdminDashboardStats = async () => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalCollectors,

    pendingWaste,
    pendingRecycling,
    pendingIllegalDump,

    collectedWaste,
    collectedRecycling,

    totalRewardPointsEarned,

    pendingRedemptions,
    approvedRedemptions,
    paidRedemptions,
  ] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      isActive: true,
    }),

    User.countDocuments({
      isActive: false,
    }),

    User.countDocuments({
      role: "Collector",
    }),

    Waste.countDocuments({
      status: "Pending",
    }),

    Recycling.countDocuments({
      status: "Pending",
    }),

    IllegalDump.countDocuments({
      status: "Pending",
    }),

    Waste.aggregate([
        {
          $match: {
            status: "Collected",
          },
        },
        {
          $unwind: "$materials",
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $ifNull: [
                  "$materials.collectedQuantity",
                  "$materials.quantity",
                ],
              },
            },
          },
        },
      ]),

    Recycling.aggregate([
        {
          $match: {
            status: "Collected",
          },
        },
        {
          $unwind: "$materials",
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $ifNull: [
                  "$materials.collectedQuantity",
                  "$materials.quantity",
              ],
            },
          },
        },
      },
    ]),

    Reward.aggregate([
      {
        $match: {
          status: "Earned",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$pointsEarned",
          },
        },
      },
    ]),

    RewardRedemption.countDocuments({
      status: "Pending",
    }),

    RewardRedemption.countDocuments({
      status: "Approved",
    }),

    RewardRedemption.countDocuments({
      status: "Paid",
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
    },

    collectors: {
      total: totalCollectors,
    },

    requests: {
      pendingWaste,
      pendingRecycling,
      pendingIllegalDump,
      totalPending:
        pendingWaste +
        pendingRecycling +
        pendingIllegalDump,
    },

    collection: {
      totalWasteCollected:
        collectedWaste[0]?.total || 0,

      totalRecyclingCollected:
        collectedRecycling[0]?.total || 0,
    },

    rewards: {
      totalPointsEarned:
        totalRewardPointsEarned[0]?.total || 0,
    },

    redemptions: {
      pending: pendingRedemptions,
      approved: approvedRedemptions,
      paid: paidRedemptions,
    },
  };
};