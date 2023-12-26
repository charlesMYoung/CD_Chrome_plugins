import { useState, useEffect } from "react";

export const usePage = ({ service }) => {
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);

  const onChange = async (cur, size) => {
    await getData(cur, size);
  };

  const getData = async (cur, size) => {
    setIsLoading(true);
    const result = await service(cur, size);
    setCurrent(result.current);
    setPageSize(result.pageSize);
    setIsLoading(false);
    setData(result.data);
    setTotal(result.total);
  };

  useEffect(() => {
    getData(current, pageSize);
  }, []);

  return {
    data,
    pagination: {
      current,
      pageSize,
      total,
    },
    isLoading,
    onChange,
  };
};
