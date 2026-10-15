import User from "../models/UserModel.js";

import {
  getCodeforcesUser,
  getRatingHistory,
} from "../services/codeforces.services.js";

export const validateHandle = (handle) => {
  if (!handle || typeof handle !== "string" || handle.trim() === "") {
    throw new Error("Codeforces handle is required");
  }

  return handle.trim();
};

// POST /api/codeforces/connect

export const connectCodeforces = async (
  req,
  res
) => {

  try {

    const { handle } = req.body;

// handle = validateHandle(handle);
    if (!handle) {

      return res.status(400).json({

        success:false,

        message:"Handle is required",

      });

    }



    const cfUser = await getCodeforcesUser(handle);



    const user =
      await User.findByIdAndUpdate(

        req.user.id,

        {
          codeforcesHandle: cfUser.handle,
        },

        {
          new:true,
        }

      )
      .select("-password");




    return res.status(200).json({

      success:true,

      message:
      "Codeforces account connected successfully",


      codeforces:{

        handle:cfUser.handle,

        rating:cfUser.rating,

        maxRating:cfUser.maxRating,

        rank:cfUser.rank,

        maxRank:cfUser.maxRank,

        contribution:cfUser.contribution,

        avatar:cfUser.avatar,

      },


      user,

    });



  } catch(error){


    console.error(error);



    if(error.message === "Codeforces handle not found"){

      return res.status(404).json({

        success:false,

        message:error.message,

      });

    }



    return res.status(500).json({

      success:false,

      message:
      "Failed to connect Codeforces account",

    });


  }

};







// GET /api/codeforces/history


export const getCodeforcesRatingHistory =
async (
  req,
  res
)=>{


  try {


    const user =
    await User.findById(req.user.id);



    if(!user){

      return res.status(404).json({

        success:false,

        message:"User not found",

      });

    }



    if(!user.codeforcesHandle){

      return res.status(400).json({

        success:false,

        message:
        "Codeforces account not connected",

      });

    }




    const history =
    await getRatingHistory(
      user.codeforcesHandle
    );

if (!history || history.length === 0) {
  return res.status(404).json({
    success: false,
    message: "No rating history found for this user",
  });
}

    return res.status(200).json({

      success:true,

      history,

    });



  }catch(error){


    console.error(error);



    return res.status(500).json({

      success:false,

      message:
      "Unable to fetch rating history",

    });


  }

};