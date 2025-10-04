import earthaccess
import dotenv
from loguru import logger
dotenv.load_dotenv()


def auth():
    earthaccess.login(strategy="environment")
    logger.info(f"Auth Status: {earthaccess.status()}")

def main():
    auth()
    # realtime phytoplankton populations
    # near_realtime_phytoplankton_search = earthaccess.search_data(
    #     short_name='PACE_OCI_L4M_MOANA_NRT',
    #     # bounding_box=(-10, 20, 10, 50),
    #     temporal=("2024-01", "2025-10"),
    #     count=-1
    # )
    # logger.info(f"Found {len(near_realtime_phytoplankton_search)} phytoplankton results")
    # earthaccess.download(near_realtime_phytoplankton_search, "./realtime_phytoplankton_populations")

    chlorophyll_concentration = earthaccess.search_data(
        short_name='PACE_OCI_L3B_CHL',
        # bounding_box=(-10, 20, 10, 50),
        temporal=("2024-03-05", "2024-03-12"),
        count=-1
    )
    logger.info(f"Found {len(chlorophyll_concentration)} chlorophyll results")
    earthaccess.download(chlorophyll_concentration, "./chlorophyll_data")

if __name__ == "__main__":
    main()
