import os

import dotenv
import earthaccess
from loguru import logger

# need an earthdata account and set EARTHDATA_TOKEN in .env
dotenv.load_dotenv()

dataset_dir = f"{os.path.dirname(os.path.dirname(os.path.realpath(__file__)))}/datasets"
date_range = ("2025-09-01", "2025-10-03")
datasets = {
    "PACE_OCI_L4M_MOANA_NRT": f"{dataset_dir}/realtime_phytoplankton_populations",
    "PACE_OCI_L3M_IOP_NRT": f"{dataset_dir}/realtime_inherent_optical_properties",
    "PACE_OCI_L3B_CHL_NRT": f"{dataset_dir}/realtime_chlorophyll_concentration",
}


def auth():
    earthaccess.login(strategy="environment")
    logger.info(f"Auth Status: {earthaccess.status()}")


def main():
    auth()
    for name, download_dir in datasets.items():
        logger.info(f"Fetching dataset: {name}")
        collection = earthaccess.search_data(
            short_name=name, temporal=date_range, count=-1
        )
        if len(collection) == 0: 
            raise ValueError(f"No files found for dataset {name}")
        logger.info(f"Found {len(collection)} files for dataset {name}")
        logger.info(f"Downloading dataset: {name}")
        earthaccess.download(collection, local_path=download_dir, show_progress=True)


if __name__ == "__main__":
    main()
