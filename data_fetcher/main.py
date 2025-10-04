import os

import dotenv
import earthaccess
from loguru import logger

dotenv.load_dotenv()

dataset_dir = f"{os.path.dirname(os.path.dirname(os.path.realpath(__file__)))}/datasets"


def auth():
    earthaccess.login(strategy="environment")
    logger.info(f"Auth Status: {earthaccess.status()}")


def main():
    auth()
    # realtime phytoplankton populations
    near_realtime_phytoplankton_search = earthaccess.search_data(
        short_name="PACE_OCI_L4M_MOANA_NRT",
        temporal=("2025-09-01", "2025-10-03"),
        count=-1,
    )
    logger.info(
        f"Found {len(near_realtime_phytoplankton_search)} phytoplankton results"
    )
    earthaccess.download(
        near_realtime_phytoplankton_search,
        f"{dataset_dir}/realtime_phytoplankton_populations",
    )

    chlorophyll_concentration = earthaccess.search_data(
        short_name="PACE_OCI_L3B_CHL_NRT",
        temporal=("2025-09-01", "2025-10-03"),
        count=-1,
    )
    logger.info(f"Found {len(chlorophyll_concentration)} chlorophyll results")
    earthaccess.download(
        chlorophyll_concentration, f"{dataset_dir}/realtime_chlorophyll_concentration"
    )


if __name__ == "__main__":
    main()
