"""
Resilient HTTP Client with automatic proxy fallback.

In corporate environments, VPNs, or after closing debugging proxies (Fiddler/Charles),
environment variables like HTTP_PROXY or HTTPS_PROXY can cause requests to fail with ProxyError.
This helper attempts standard requests first, and automatically retries with trust_env=False
if a ProxyError or ProxyConnectionError occurs.
"""

import logging
import requests
from requests.exceptions import ProxyError, SSLError, ConnectionError

logger = logging.getLogger(__name__)


def resilient_get(url: str, params: dict = None, timeout: float = 6.0) -> requests.Response:
    """
    Performs GET request with proxy resilience.
    If default environment proxy fails, retries directly with trust_env=False.
    """
    try:
        # 1. Standard request (respects configured system proxy if functional)
        return requests.get(url, params=params, timeout=timeout)
    except (ProxyError, ConnectionError) as e:
        logger.warning(f"Standard request to {url} failed with proxy/connection error: {e}. Retrying with direct connection (trust_env=False)...")
        # 2. Retry ignoring environment proxy
        session = requests.Session()
        session.trust_env = False
        return session.get(url, params=params, timeout=timeout)
