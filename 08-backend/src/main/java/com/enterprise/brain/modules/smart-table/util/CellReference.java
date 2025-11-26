package com.enterprise.brain.modules.smart-table.util;

/**
 * 单元格引用工具类，用于处理Excel风格的单元格引用（如"A1"）与行列索引（如(0,0)）的转换
 */
public class CellReference {
    private int row;  // 改为基本类型int，避免NPE
    private int column;  // 改为基本类型int，避免NPE
    
    /**
     * 构造单元格引用
     * @param row 行索引（从0开始）
     * @param column 列索引（从0开始）
     */
    public CellReference(int row, int column) {
        this.row = row;
        this.column = column;
    }
    
    public int getRow() {
        return row;
    }
    
    public void setRow(int row) {
        this.row = row;
    }
    
    public int getColumn() {
        return column;
    }
    
    public void setColumn(int column) {
        this.column = column;
    }
    
    /**
     * 将单元格引用字符串（如"A1"）解析为CellReference对象
     * @param reference 单元格引用字符串（支持大小写字母，如"A1"、"b2"）
     * @return 解析后的CellReference（行列索引从0开始）
     * @throws IllegalArgumentException 当输入字符串格式无效时抛出
     */
    public static CellReference fromString(String reference) {
        if (reference == null || reference.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid cell reference: " + reference);
        }
        
        // 分离列字母和行数字
        String colStr = reference.replaceAll("\\d+", "");
        String rowStr = reference.replaceAll("[A-Za-z]+", "");
        
        if (colStr.isEmpty() || rowStr.isEmpty()) {
            throw new IllegalArgumentException("Invalid cell reference format: " + reference);
        }
        
        // 计算列索引（A=0, B=1, ..., Z=25, AA=26...）
        int col = 0;
        for (char c : colStr.toUpperCase().toCharArray()) {
            col = col * 26 + (c - 'A' + 1);
        }
        
        // 计算行索引（1 -> 0）
        try {
            int row = Integer.parseInt(rowStr) - 1;
            return new CellReference(row, col - 1);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid row number in reference: " + reference, e);
        }
    }
    
    /**
     * 将当前单元格引用转换为字符串形式（如(0,0) -> "A1"）
     * @return 单元格引用字符串
     */
    @Override
    public String toString() {
        StringBuilder colStr = new StringBuilder();
        int col = column + 1;  // 转换为1-based索引计算列字母
        
        while (col > 0) {
            colStr.insert(0, (char) ('A' + (col - 1) % 26));
            col = (col - 1) / 26;
        }
        
        return colStr.toString() + (row + 1);  // 行索引转换为1-based
    }
}
